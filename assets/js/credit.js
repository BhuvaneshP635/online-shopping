
$(document).ready(function () {

    const idToken = sessionStorage.getItem("idToken");
    const userId = sessionStorage.getItem("userId");

    if (!idToken || !userId) {
        window.location.href = "login.html";
        return;
    }

    async function loadCredit() {
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

            const limit = Number(
                fields.creditLimit?.integerValue ??
                fields.creditLimit?.doubleValue ??
                0
            );

            const used = Number(
                fields.creditUsed?.integerValue ??
                fields.creditUsed?.doubleValue ??
                0
            );

            const available = Math.max(0, limit - used);

            $("#creditLimit").text("₹" + limit.toFixed(2));
            $("#creditUsed").text("₹" + used.toFixed(2));
            $("#availableCredit").text("₹" + available.toFixed(2));

            $("#message").text("");

        } catch (error) {
            console.error(error.response?.data || error);
            $("#message").text("Unable to load credit information.");
        }
    }

    $("#logoutButton").on("click", function () {
        sessionStorage.clear();
        window.location.href = "login.html";
    });

    loadCredit();

});
