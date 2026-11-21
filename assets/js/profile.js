
$(document).ready(function () {

    const idToken = sessionStorage.getItem("idToken");
    const userId = sessionStorage.getItem("userId");
    const email = sessionStorage.getItem("email");

    if (!idToken || !userId) {
        window.location.href = "login.html";
        return;
    }

    async function loadProfile() {
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

            $("#profileName").text(fields.name?.stringValue || "Not provided");
            $("#profileEmail").text(fields.email?.stringValue || email || "Not available");
            $("#profileId").text(userId);
            $("#profileRole").text(fields.role?.stringValue || "customer");
            $("#profileStatus").text(
                fields.active?.booleanValue ? "Active" : "Inactive"
            );

            $("#message").text("");

        } catch (error) {
            console.error(error.response?.data || error);
            $("#message").text("Unable to load your profile.");
        }
    }

    $("#logoutButton").on("click", function () {
        sessionStorage.clear();
        window.location.href = "login.html";
    });

    loadProfile();

});
