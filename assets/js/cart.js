
$(document).ready(function () {

    if (!sessionStorage.getItem("idToken")) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    function getCart() {
        return JSON.parse(sessionStorage.getItem("cart") || "[]");
    }

    function saveCart(cart) {
        sessionStorage.setItem("cart", JSON.stringify(cart));
        displayCart();
    }

    function displayCart() {
        const cart = getCart();
        const container = $("#cartContainer");

        container.empty();

        if (cart.length === 0) {
            container.html("<p>Your cart is empty.</p>");
            $("#cartTotal").text("Total: ₹0");
            $("#checkoutButton").prop("disabled", true);
            return;
        }

        let total = 0;

        cart.forEach(item => {
            const subtotal = item.price * item.quantity;
            total += subtotal;

            const card = $("<div>").addClass("catalogue-card");

            const image = $("<img>")
                .attr("src", item.imageUrl || "../assets/images/no-image.png")
                .attr("alt", item.title)
                .addClass("catalogue-product-image");

            image.on("error", function () {
                $(this)
                    .off("error")
                    .attr("src", "../assets/images/no-image.png");
            });

            card.append(image);
            card.append($("<h3>").text(item.title));
            card.append($("<p>").text("Price: ₹" + item.price));
            card.append($("<p>").text("Subtotal: ₹" + subtotal));

            const quantityInput = $("<input>")
                .attr("type", "number")
                .attr("min", 1)
                .attr("max", item.availableQuantity)
                .val(item.quantity);

            quantityInput.on("change", function () {
                const newQuantity = Number($(this).val());

                if (
                    !Number.isInteger(newQuantity) ||
                    newQuantity < 1 ||
                    newQuantity > item.availableQuantity
                ) {
                    alert("Enter a valid quantity within available stock.");
                    displayCart();
                    return;
                }

                const updatedCart = getCart();
                const selected = updatedCart.find(product => product.id === item.id);

                selected.quantity = newQuantity;
                saveCart(updatedCart);
            });

            card.append($("<label>").text("Quantity: "));
            card.append(quantityInput);

            const removeButton = $("<button>")
                .text("Remove")
                .on("click", function () {
                    const updatedCart = getCart().filter(
                        product => product.id !== item.id
                    );

                    saveCart(updatedCart);
                });

            card.append(removeButton);
            container.append(card);
        });

        $("#cartTotal").text("Total: ₹" + total);
        $("#checkoutButton").prop("disabled", false);
    }

    $("#clearCartButton").on("click", function () {
        if (confirm("Do you want to clear your cart?")) {
            sessionStorage.removeItem("cart");
            displayCart();
        }
    });

    $("#checkoutButton").on("click", function () {
        window.location.href = "checkout.html";
    });

    $("#logoutButton").on("click", function () {
        sessionStorage.clear();
        window.location.href = "login.html";
    });

    displayCart();

});
