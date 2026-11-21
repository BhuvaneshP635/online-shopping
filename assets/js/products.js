
$(document).ready(function () {

    const idToken = sessionStorage.getItem("idToken");

    if (!idToken) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    let products = [];

    async function loadProducts() {
        try {
            $("#message").text("Loading products...");

            const response = await axios.post(
                `${FIRESTORE_URL}:runQuery`,
                {
                    structuredQuery: {
                        from: [{ collectionId: "products" }],
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

            products = response.data
                .filter(item => item.document)
                .map(item => {
                    const fields = item.document.fields;

                    return {
                        id: item.document.name.split("/").pop(),
                        title: fields.title?.stringValue || "",
                        description: fields.description?.stringValue || "",
                        categoryId: fields.categoryId?.stringValue || "",
                        price: Number(
                            fields.price?.integerValue ??
                            fields.price?.doubleValue ??
                            0
                        ),
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

            let options = '<option value="">All Categories</option>';

            response.data.forEach(item => {
                if (!item.document) return;

                const id = item.document.name.split("/").pop();
                const name = item.document.fields.name?.stringValue || "";

                options += `<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`;
            });

            $("#categoryFilter").html(options);

        } catch (error) {
            console.error(error.response?.data || error);
            $("#message").text("Unable to load categories.");
        }
    }

    function displayProducts(list) {
        const container = $("#productContainer");
        container.empty();

        if (list.length === 0) {
            container.html("<p>No products available.</p>");
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
            card.append($("<p>").text("Price: ₹" + product.price));
            card.append($("<p>").text("Available: " + product.quantity));

            const addButton = $("<button>")
                .text(product.quantity > 0 ? "Add to Cart" : "Out of Stock")
                .prop("disabled", product.quantity <= 0)
                .on("click", function () {
                    addToCart(product);
                });

            card.append(addButton);
            container.append(card);
        });
    }

    function filterProducts() {
        const search = $("#searchInput").val().toLowerCase().trim();
        const category = $("#categoryFilter").val();

        const filtered = products.filter(product => {
            const matchesSearch =
                product.title.toLowerCase().includes(search) ||
                product.description.toLowerCase().includes(search);

            const matchesCategory =
                !category || product.categoryId === category;

            return matchesSearch && matchesCategory;
        });

        displayProducts(filtered);
    }

    function getCart() {
        return JSON.parse(sessionStorage.getItem("cart") || "[]");
    }

    function saveCart(cart) {
        sessionStorage.setItem("cart", JSON.stringify(cart));
        updateCartCount();
    }

    function addToCart(product) {
        const cart = getCart();
        const existing = cart.find(item => item.id === product.id);

        if (existing) {
            if (existing.quantity >= product.quantity) {
                alert("You cannot add more than the available stock.");
                return;
            }

            existing.quantity++;
        } else {
            cart.push({
                id: product.id,
                title: product.title,
                price: product.price,
                imageUrl: product.imageUrl,
                availableQuantity: product.quantity,
                quantity: 1
            });
        }

        saveCart(cart);
        alert(product.title + " added to cart.");
    }

    function updateCartCount() {
        const total = getCart().reduce(
            (sum, item) => sum + Number(item.quantity),
            0
        );

        $("#cartCount").text(total);
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

    $("#searchInput").on("input", filterProducts);
    $("#categoryFilter").on("change", filterProducts);

    $("#logoutButton").on("click", function () {
        sessionStorage.clear();
        window.location.href = "login.html";
    });

    updateCartCount();

    async function initializePage() {
        await loadCategories();
        await loadProducts();
    }

    initializePage();

});
