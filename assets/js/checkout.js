
$(document).ready(function () {

    const idToken = sessionStorage.getItem("idToken");
    const userId = sessionStorage.getItem("userId");
    const email = sessionStorage.getItem("email");

    if (!idToken || !userId) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    let cart = JSON.parse(sessionStorage.getItem("cart") || "[]");
    let creditLimit = 0;
    let creditUsed = 0;

    function getNumber(field) {
        return Number(
            field?.integerValue ??
            field?.doubleValue ??
            0
        );
    }

    function calculateTotal() {
        return cart.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );
    }

    function displaySummary() {
        const container = $("#checkoutItems");
        container.empty();

        if (cart.length === 0) {
            container.html("<p>Your cart is empty.</p>");
            $("#placeOrderButton").prop("disabled", true);
            $("#checkoutTotal").text("Total: ₹0");
            return;
        }

        cart.forEach(item => {
            const subtotal = item.price * item.quantity;

            const row = $("<p>").text(
                item.title + " × " + item.quantity + " = ₹" + subtotal
            );

            container.append(row);
        });

        $("#checkoutTotal").text("Total: ₹" + calculateTotal());
    }

    async function loadCreditInformation() {
        try {
            const response = await axios.get(
                `${FIRESTORE_URL}/users/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${idToken}`
                    }
                }
            );

            const fields = response.data.fields;

            creditLimit = getNumber(fields.creditLimit);
            creditUsed = getNumber(fields.creditUsed);

            const available = Math.max(0, creditLimit - creditUsed);

            $("#creditInfo").text(
                "Credit Limit: ₹" + creditLimit +
                " | Used: ₹" + creditUsed +
                " | Available: ₹" + available
            );

        } catch (error) {
            console.error(error.response?.data || error);
            $("#creditInfo").text("Unable to load credit information.");
        }
    }

    $("#checkoutForm").on("submit", async function (event) {
        event.preventDefault();

        if (cart.length === 0) {
            $("#message").text("Your cart is empty.");
            return;
        }

        const fullName = $("#fullName").val().trim();
        const phone = $("#phone").val().trim();
        const address = $("#address").val().trim();
        const paymentMethod = $('input[name="paymentMethod"]:checked').val();
        const total = calculateTotal();

        if (!fullName || !phone || !address) {
            $("#message").text("Please complete all delivery details.");
            return;
        }

        if (!/^[0-9]{10}$/.test(phone)) {
            $("#message").text("Enter a valid 10-digit phone number.");
            return;
        }

        if (paymentMethod === "credit") {
            const availableCredit = creditLimit - creditUsed;

            if (total > availableCredit) {
                $("#message").text("Insufficient credit limit.");
                return;
            }
        }

        const items = cart.map(item => ({
            mapValue: {
                fields: {
                    productId: { stringValue: item.id },
                    title: { stringValue: item.title },
                    price: { doubleValue: Number(item.price) },
                    quantity: { integerValue: String(item.quantity) },
                    subtotal: {
                        doubleValue: Number(item.price * item.quantity)
                    }
                }
            }
        }));

        const orderData = {
            fields: {
                customerId: { stringValue: userId },
                email: { stringValue: email || "" },
                fullName: { stringValue: fullName },
                phone: { stringValue: phone },
                address: { stringValue: address },
                paymentMethod: { stringValue: paymentMethod },
                status: { stringValue: "placed" },
                total: { doubleValue: total },
                createdAt: {
                    timestampValue: new Date().toISOString()
                },
                items: {
                    arrayValue: {
                        values: items
                    }
                }
            }
        };

        try {
            $("#placeOrderButton").prop("disabled", true);
            $("#message").text("Placing your order...");

            await axios.post(
                `${FIRESTORE_URL}/orders`,
                orderData,
                {
                    headers: {
                        Authorization: `Bearer ${idToken}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            sessionStorage.removeItem("cart");

            alert("Order placed successfully!");

            window.location.href = "orders.html";

        } catch (error) {
            console.error(error.response?.data || error);
            $("#message").text(
                error.response?.data?.error?.message ||
                "Unable to place order. Please try again."
            );

            $("#placeOrderButton").prop("disabled", false);
        }
    });

    $("#logoutButton").on("click", function () {
        sessionStorage.clear();
        window.location.href = "login.html";
    });

    displaySummary();
    loadCreditInformation();

});
