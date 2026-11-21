
$(document).ready(function () {

    const idToken = sessionStorage.getItem("idToken");
    const userId = sessionStorage.getItem("userId");
    const adminUid = "QKdT5r533FSmguo60EmawgsvwD62";

    if (!idToken || userId !== adminUid) {
        alert("Admin access required.");
        window.location.href = "login.html";
        return;
    }

    let customers = [];

    async function loadCustomers() {
        try {
            $("#message").text("Loading customers...");

            const response = await axios.post(
                `${FIRESTORE_URL}:runQuery`,
                {
                    structuredQuery: {
                        from: [{ collectionId: "users" }]
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${idToken}`
                    }
                }
            );

            customers = response.data
                .filter(item => item.document)
                .map(item => {
                    const doc = item.document;
                    const fields = doc.fields;

                    return {
                        id: doc.name.split("/").pop(),
                        name: fields.name?.stringValue || "Not provided",
                        email: fields.email?.stringValue || "Not provided",
                        role: fields.role?.stringValue || "customer",
                        creditLimit: Number(
                            fields.creditLimit?.integerValue ??
                            fields.creditLimit?.doubleValue ??
                            0
                        ),
                        creditUsed: Number(
                            fields.creditUsed?.integerValue ??
                            fields.creditUsed?.doubleValue ??
                            0
                        ),
                        active: fields.active?.booleanValue ?? false
                    };
                })
                .filter(customer => customer.role === "customer");

            displayCustomers(customers);
            $("#message").text("");

        } catch (error) {
            console.error(error.response?.data || error);
            $("#message").text("Unable to load customers.");
        }
    }

    function displayCustomers(list) {
        const container = $("#customerContainer");
        container.empty();

        if (list.length === 0) {
            container.html("<p>No customers found.</p>");
            return;
        }

        list.forEach(customer => {
            const card = $("<div>").addClass("catalogue-card");

            card.append($("<h3>").text(customer.name));
            card.append($("<p>").text("Email: " + customer.email));
            card.append($("<p>").text("Customer ID: " + customer.id));
            card.append($("<p>").text("Credit Used: ₹" + customer.creditUsed));
            card.append($("<p>").text("Status: " + (customer.active ? "Active" : "Inactive")));

            const limitInput = $("<input>")
                .attr("type", "number")
                .attr("min", "0")
                .attr("step", "0.01")
                .val(customer.creditLimit);

            const saveButton = $("<button>")
                .text("Update Credit Limit")
                .on("click", function () {
                    updateCreditLimit(customer.id, limitInput.val());
                });

            card.append($("<label>").text("Credit Limit: "));
            card.append(limitInput);
            card.append(saveButton);

            container.append(card);
        });
    }

    async function updateCreditLimit(customerId, value) {
        const limit = Number(value);

        if (!Number.isFinite(limit) || limit < 0) {
            alert("Enter a valid credit limit.");
            return;
        }

        const customer = customers.find(item => item.id === customerId);

        if (!customer) return;

        if (limit < customer.creditUsed) {
            alert("Credit limit cannot be lower than the customer's used credit.");
            return;
        }

        try {
            await axios.patch(
                `${FIRESTORE_URL}/users/${customerId}?updateMask.fieldPaths=creditLimit`,
                {
                    fields: {
                        creditLimit: { doubleValue: limit }
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${idToken}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            alert("Credit limit updated successfully.");
            await loadCustomers();

        } catch (error) {
            console.error(error.response?.data || error);
            alert("Unable to update credit limit.");
        }
    }

    $("#searchCustomer").on("input", function () {
        const search = $(this).val().toLowerCase();

        const filtered = customers.filter(customer =>
            customer.name.toLowerCase().includes(search) ||
            customer.email.toLowerCase().includes(search)
        );

        displayCustomers(filtered);
    });

    $("#logoutButton").on("click", function () {
        sessionStorage.clear();
        window.location.href = "login.html";
    });

    loadCustomers();

});
