
$(document).ready(async function () {

    const idToken = sessionStorage.getItem("idToken");

    if (!idToken) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    const products = [
        {
            id: "P1001",
            title: "Smartphone",
            description: "5G Android smartphone",
            categoryId: "electronics",
            price: 15999,
            quantity: 20
        },
        {
            id: "P1002",
            title: "Wireless Headphones",
            description: "Bluetooth headphones",
            categoryId: "electronics",
            price: 1999,
            quantity: 30
        },
        {
            id: "P1003",
            title: "Mens T-Shirt",
            description: "Cotton casual T-shirt",
            categoryId: "fashion",
            price: 599,
            quantity: 50
        }
    ];

    for (const product of products) {
        try {
            await axios.patch(
                `${FIRESTORE_URL}/products/${product.id}`,
                {
                    fields: {
                        title: { stringValue: product.title },
                        description: { stringValue: product.description },
                        categoryId: { stringValue: product.categoryId },
                        price: { integerValue: String(product.price) },
                        quantity: { integerValue: String(product.quantity) },
                        active: { booleanValue: true }
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${idToken}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            console.log(product.title + " added successfully.");

        } catch (error) {
            console.error(
                "Failed to add " + product.title,
                error.response?.data || error
            );
        }
    }

    alert("Product seeding completed. Check the browser console and Firestore.");

});
