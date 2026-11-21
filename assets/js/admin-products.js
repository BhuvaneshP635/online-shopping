
$(document).ready(function () {

    const idToken = sessionStorage.getItem("idToken");
    const userId = sessionStorage.getItem("userId");
    const adminUid = "QKdT5r533FSmguo60EmawgsvwD62";

    if (!idToken || userId !== adminUid) {
        alert("Admin access required.");
        window.location.href = "login.html";
        return;
    }

    let products = [];

    function clearForm() {
        $("#productForm")[0].reset();
        $("#productId").val("");
        $("#active").prop("checked", true);
        $("#saveButton").text("Add Product");
    }

    async function loadProducts() {
        try {
            $("#message").text("Loading products...");

            const response = await axios.post(
                `${FIRESTORE_URL}:runQuery`,
                {
                    structuredQuery: {
                        from: [{ collectionId: "products" }]
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${idToken}`
                    }
                }
            );

            products = response.data
                .filter(item => item.document)
                .map(item => {
                    const doc = item.document;
                    const fields = doc.fields;

                    return {
                        id: doc.name.split("/").pop(),
                        title: fields.title?.stringValue || "",
                        description: fields.description?.stringValue || "",
                        categoryId: fields.categoryId?.stringValue || "",
                        price: Number(fields.price?.integerValue ?? fields.price?.doubleValue ?? 0),
                        quantity: Number(fields.quantity?.integerValue || 0),
                        imageUrl: fields.imageUrl?.stringValue || "",
                        active: fields.active?.booleanValue ?? false
                    };
                });

            displayProducts(products);
            $("#message").text("");

        } catch (error) {
            console.error(error.response?.data || error);
            $("#message").text("Unable to load products.");
        }
    }

    async function loadCategories() {
        try {
            const response = await axios.post(
                `${FIRESTORE_URL}:runQuery`,
                {
                    structuredQuery: {
                        from: [{ collectionId: "categories" }],
                        where: {
                            fieldFilter: {
                                field: { fieldPath: "active" },
                                op: "EQUAL",
                                value: { booleanValue: true }
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

            let options = '<option value="">Select a category</option>';

            response.data.forEach(item => {
                if (!item.document) return;

                const id = item.document.name.split("/").pop();
                const name = item.document.fields.name?.stringValue || "";

                options += `<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`;
            });

            $("#categoryId").html(options);

        } catch (error) {
            console.error(error.response?.data || error);
            alert("Unable to load categories.");
        }
    }

    function displayProducts(list) {
        const container = $("#adminProductContainer");
        container.empty();

        if (list.length === 0) {
            container.html("<p>No products found.</p>");
            return;
        }

        list.forEach(product => {
            const card = $("<div>").addClass("catalogue-card");

            const image = $("<img>")
                .attr("src", product.imageUrl || "../assets/images/no-image.png")
                .attr("alt", product.title)
                .addClass("catalogue-product-image");

            image.on("error", function () {
                $(this)
                    .off("error")
                    .attr("src", "../assets/images/no-image.png");
            });

            card.append(image);
            card.append($("<h3>").text(product.title));
            card.append($("<p>").text(product.description));
            card.append($("<p>").text("ID: " + product.id));
            card.append($("<p>").text("Category: " + product.categoryId));
            card.append($("<p>").text("Price: ₹" + product.price));
            card.append($("<p>").text("Quantity: " + product.quantity));
            card.append($("<p>").text("Status: " + (product.active ? "Active" : "Inactive")));

            const editButton = $("<button>")
                .text("Edit")
                .on("click", function () {
                    editProduct(product.id);
                });

            const statusButton = $("<button>")
                .text(product.active ? "Deactivate" : "Activate")
                .on("click", function () {
                    toggleProduct(product);
                });

            const deleteButton = $("<button>")
                .text("Delete")
                .on("click", function () {
                    deleteProduct(product.id);
                });

            card.append(editButton, statusButton, deleteButton);
            container.append(card);
        });
    }

    $("#productForm").on("submit", async function (event) {
        event.preventDefault();

        const id = $("#productId").val() || "P" + Date.now();

        const product = {
            title: $("#title").val().trim(),
            description: $("#description").val().trim(),
            categoryId: $("#categoryId").val().trim(),
            price: Number($("#price").val()),
            quantity: Number($("#quantity").val()),
            imageUrl: $("#imageUrl").val().trim(),
            active: $("#active").is(":checked")
        };

        if (
            !product.title ||
            !product.description ||
            !product.categoryId ||
            !Number.isFinite(product.price) ||
            product.price <= 0 ||
            !Number.isInteger(product.quantity) ||
            product.quantity < 0
        ) {
            $("#message").text("Please enter valid product details.");
            return;
        }

        try {
            await axios.patch(
                `${FIRESTORE_URL}/products/${id}`,
                {
                    fields: {
                        title: { stringValue: product.title },
                        description: { stringValue: product.description },
                        categoryId: { stringValue: product.categoryId },
                        price: { doubleValue: product.price },
                        quantity: { integerValue: String(product.quantity) },
                        imageUrl: { stringValue: product.imageUrl },
                        active: { booleanValue: product.active }
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${idToken}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            $("#message").text("Product saved successfully.");
            clearForm();
            await loadProducts();

        } catch (error) {
            console.error(error.response?.data || error);
            $("#message").text("Unable to save product.");
        }
    });

    function editProduct(id) {
        const product = products.find(item => item.id === id);

        if (!product) return;

        $("#productId").val(product.id);
        $("#title").val(product.title);
        $("#description").val(product.description);
        $("#categoryId").val(product.categoryId);
        $("#price").val(product.price);
        $("#quantity").val(product.quantity);
        $("#imageUrl").val(product.imageUrl);
        $("#active").prop("checked", product.active);

        $("#saveButton").text("Update Product");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function toggleProduct(product) {
        try {
            await axios.patch(
                `${FIRESTORE_URL}/products/${product.id}`,
                {
                    fields: {
                        title: { stringValue: product.title },
                        description: { stringValue: product.description },
                        categoryId: { stringValue: product.categoryId },
                        price: { doubleValue: product.price },
                        quantity: { integerValue: String(product.quantity) },
                        imageUrl: { stringValue: product.imageUrl || "" },
                        active: { booleanValue: !product.active }
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${idToken}`
                    }
                }
            );

            await loadProducts();

        } catch (error) {
            console.error(error.response?.data || error);
            alert("Unable to change product status.");
        }
    }

    async function deleteProduct(id) {
        if (!confirm("Are you sure you want to delete this product?")) {
            return;
        }

        try {
            await axios.delete(
                `${FIRESTORE_URL}/products/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${idToken}`
                    }
                }
            );

            $("#message").text("Product deleted successfully.");
            await loadProducts();

        } catch (error) {
            console.error(error.response?.data || error);
            alert("Unable to delete product.");
        }
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

    $("#clearButton").on("click", clearForm);

    $("#logoutButton").on("click", function () {
        sessionStorage.clear();
        window.location.href = "login.html";
    });

    async function initializePage() {
        await loadCategories();
        await loadProducts();
    }

    initializePage();

});
