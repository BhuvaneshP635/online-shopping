
$(document).ready(function () {

    const idToken = sessionStorage.getItem("idToken");
    const userId = sessionStorage.getItem("userId");
    const adminUid = "QKdT5r533FSmguo60EmawgsvwD62";

    if (!idToken || userId !== adminUid) {
        alert("Admin access required.");
        window.location.href = "login.html";
        return;
    }

    async function getCollection(collectionName) {
        const response = await axios.post(
            `${FIRESTORE_URL}:runQuery`,
            {
                structuredQuery: {
                    from: [{ collectionId: collectionName }]
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${idToken}`
                }
            }
        );

        return response.data
            .filter(item => item.document)
            .map(item => item.document);
    }

    function numberValue(field) {
        return Number(field?.integerValue ?? field?.doubleValue ?? 0);
    }

    async function loadReports() {
        try {
            $("#message").text("Loading reports...");

            const [orderDocs, customerDocs, productDocs] = await Promise.all([
                getCollection("orders"),
                getCollection("users"),
                getCollection("products")
            ]);

            const orders = orderDocs.map(doc => ({
                fields: doc.fields
            }));

            const customers = customerDocs
                .map(doc => ({
                    id: doc.name.split("/").pop(),
                    fields: doc.fields
                }))
                .filter(customer => customer.fields.role?.stringValue === "customer");

            const products = productDocs.map(doc => ({
                id: doc.name.split("/").pop(),
                title: doc.fields.title?.stringValue || "Unknown product",
                quantity: numberValue(doc.fields.quantity)
            }));

            let totalSales = 0;
            let cashCount = 0;
            let creditCount = 0;

            const customerSales = {};
            const productSales = {};

            orders.forEach(order => {
                const fields = order.fields;
                const total = numberValue(fields.total);
                const method = fields.paymentMethod?.stringValue || "";

                totalSales += total;

                if (method === "cash") cashCount++;
                if (method === "credit") creditCount++;

                const customerId = fields.customerId?.stringValue || "Unknown";
                const email = fields.email?.stringValue || customerId;

                if (!customerSales[customerId]) {
                    customerSales[customerId] = {
                        email: email,
                        total: 0,
                        orders: 0
                    };
                }

                customerSales[customerId].total += total;
                customerSales[customerId].orders++;

                const items = fields.items?.arrayValue?.values || [];

                items.forEach(value => {
                    const item = value.mapValue.fields;
                    const productId = item.productId?.stringValue || "Unknown";
                    const title = item.title?.stringValue || "Unknown product";
                    const quantity = numberValue(item.quantity);

                    if (!productSales[productId]) {
                        productSales[productId] = {
                            title: title,
                            quantity: 0
                        };
                    }

                    productSales[productId].quantity += quantity;
                });
            });

            $("#totalSales").text("₹" + totalSales.toFixed(2));
            $("#totalOrders").text(orders.length);
            $("#cashOrders").text(cashCount);
            $("#creditOrders").text(creditCount);
            $("#totalCustomers").text(customers.length);
            $("#totalProducts").text(products.length);

            displayTopCustomers(customerSales);
            displayInventory(products);
            displayProductSales(productSales);

            $("#message").text("");

        } catch (error) {
            console.error(error.response?.data || error);
            $("#message").text("Unable to load reports.");
        }
    }

    function displayTopCustomers(data) {
        const container = $("#topCustomers");
        container.empty();

        const list = Object.values(data)
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

        if (list.length === 0) {
            container.text("No customer sales found.");
            return;
        }

        list.forEach((customer, index) => {
            const card = $("<div>").addClass("catalogue-card");

            card.append($("<h3>").text((index + 1) + ". " + customer.email));
            card.append($("<p>").text("Orders: " + customer.orders));
            card.append($("<p>").text("Total Purchase: ₹" + customer.total.toFixed(2)));

            container.append(card);
        });
    }

    function displayInventory(products) {
        const container = $("#inventoryReport");
        container.empty();

        const lowStock = products.filter(product => product.quantity <= 5);
        const highStock = products.filter(product => product.quantity > 5);

        container.append(
            $("<h3>").text("Low Stock Products (5 or fewer): " + lowStock.length)
        );

        lowStock.forEach(product => {
            container.append(
                $("<p>").text(product.title + " - " + product.quantity + " remaining")
            );
        });

        container.append(
            $("<h3>").text("Higher Stock Products: " + highStock.length)
        );

        highStock.forEach(product => {
            container.append(
                $("<p>").text(product.title + " - " + product.quantity + " remaining")
            );
        });
    }

    function displayProductSales(data) {
        const products = Object.values(data);

        const top = [...products]
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        const bottom = [...products]
            .sort((a, b) => a.quantity - b.quantity)
            .slice(0, 10);

        $("#topProducts").empty();
        $("#bottomProducts").empty();

        if (products.length === 0) {
            $("#topProducts").text("No product sales found.");
            $("#bottomProducts").text("No product sales found.");
            return;
        }

        top.forEach((product, index) => {
            $("#topProducts").append(
                $("<p>").text(
                    (index + 1) + ". " + product.title +
                    " - " + product.quantity + " sold"
                )
            );
        });

        bottom.forEach((product, index) => {
            $("#bottomProducts").append(
                $("<p>").text(
                    (index + 1) + ". " + product.title +
                    " - " + product.quantity + " sold"
                )
            );
        });
    }

    $("#logoutButton").on("click", function () {
        sessionStorage.clear();
        window.location.href = "login.html";
    });

    loadReports();

});
