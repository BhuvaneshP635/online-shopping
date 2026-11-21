
$(document).ready(function () {

    const idToken = sessionStorage.getItem("idToken");
    const userId = sessionStorage.getItem("userId");

    if (!idToken || !userId) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    async function loadOrders() {
        try {
            const response = await axios.post(
                `${FIRESTORE_URL}:runQuery`,
                {
                    structuredQuery: {
                        from: [{ collectionId: "orders" }],
                        where: {
                            fieldFilter: {
                                field: { fieldPath: "customerId" },
                                op: "EQUAL",
                                value: { stringValue: userId }
                            }
                        }
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${idToken}`
                    }
                }
            );

            const orders = response.data
                .filter(item => item.document)
                .map(item => ({
                    id: item.document.name.split("/").pop(),
                    fields: item.document.fields
                }));

            displayOrders(orders);

        } catch (error) {
            console.error(error.response?.data || error);
            $("#message").text("Unable to load orders.");
        }
    }

    function displayOrders(orders) {
        const container = $("#ordersContainer");
        container.empty();

        if (orders.length === 0) {
            $("#message").text("You have not placed any orders yet.");
            return;
        }

        $("#message").text("");

        orders.reverse().forEach(order => {
            const fields = order.fields;

            const card = $("<div>").addClass("catalogue-card");

            const total = Number(
                fields.total?.doubleValue ??
                fields.total?.integerValue ??
                0
            );

            const date = fields.createdAt?.timestampValue
                ? new Date(fields.createdAt.timestampValue).toLocaleString()
                : "Not available";

            card.append($("<h3>").text("Order ID: " + order.id));
            card.append($("<p>").text("Date: " + date));
            card.append($("<p>").text("Customer: " + (fields.fullName?.stringValue || "")));
            card.append($("<p>").text("Address: " + (fields.address?.stringValue || "")));
            card.append($("<p>").text("Payment: " + (fields.paymentMethod?.stringValue || "")));
            card.append($("<p>").text("Status: " + (fields.status?.stringValue || "")));
            card.append($("<h3>").text("Total: ₹" + total));

            const itemValues = fields.items?.arrayValue?.values || [];

            const itemList = $("<div>");

            itemValues.forEach(value => {
                const item = value.mapValue.fields;

                const title = item.title?.stringValue || "Product";
                const quantity = Number(item.quantity?.integerValue || 0);
                const subtotal = Number(item.subtotal?.doubleValue || 0);

                itemList.append(
                    $("<p>").text(title + " × " + quantity + " = ₹" + subtotal)
                );
            });

            card.append(itemList);

            const billButton = $("<button>")
                .text("Generate Bill")
                .on("click", function () {
                    generateBill(order);
                });

            card.append(billButton);
            container.append(card);
        });
    }

    function generateBill(order) {
        const fields = order.fields;

        const total = Number(
            fields.total?.doubleValue ??
            fields.total?.integerValue ??
            0
        );

        const date = fields.createdAt?.timestampValue
            ? new Date(fields.createdAt.timestampValue).toLocaleString()
            : "Not available";

        const items = fields.items?.arrayValue?.values || [];

        let bill = `
            <html>
            <head>
                <title>ShopEase Bill</title>
                <style>
                    body { font-family: Arial; padding: 30px; }
                    h1, h2 { text-align: center; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
                    .total { text-align: right; margin-top: 20px; }
                </style>
            </head>
            <body>
                <h1>ShopEase</h1>
                <h2>Order Bill</h2>
                <p>Order ID: ${escapeHtml(order.id)}</p>
                <p>Customer: ${escapeHtml(fields.fullName?.stringValue || "")}</p>
                <p>Email: ${escapeHtml(fields.email?.stringValue || "")}</p>
                <p>Date: ${escapeHtml(date)}</p>
                <p>Address: ${escapeHtml(fields.address?.stringValue || "")}</p>
                <p>Payment: ${escapeHtml(fields.paymentMethod?.stringValue || "")}</p>
                <table>
                    <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Subtotal</th>
                    </tr>
        `;

        items.forEach(value => {
            const item = value.mapValue.fields;

            bill += `
                <tr>
                    <td>${escapeHtml(item.title?.stringValue || "")}</td>
                    <td>${Number(item.quantity?.integerValue || 0)}</td>
                    <td>₹${Number(item.subtotal?.doubleValue || 0)}</td>
                </tr>
            `;
        });

        bill += `
                </table>
                <h3 class="total">Grand Total: ₹${total}</h3>
                <p>Thank you for shopping with ShopEase!</p>
                <script>window.onload = function () { window.print(); };</script>
            </body>
            </html>
        `;

        const billWindow = window.open("", "_blank");

        if (!billWindow) {
            alert("Please allow pop-ups to generate your bill.");
            return;
        }

        billWindow.document.write(bill);
        billWindow.document.close();
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    $("#logoutButton").on("click", function () {
        sessionStorage.clear();
        window.location.href = "login.html";
    });

    loadOrders();

});
