
$(document).ready(async function () {

    const idToken = sessionStorage.getItem("idToken");
    const userId = sessionStorage.getItem("userId");

    const adminUid = "QKdT5r533FSmguo60EmawgsvwD62";

    if (!idToken || !userId) {
        window.location.href = "login.html";
        return;
    }

    if (userId !== adminUid) {
        alert("Access denied. Admin account required.");
        window.location.href = "dashboard.html";
        return;
    }

    try {
        await axios.get(
            `${FIRESTORE_URL}/users/${userId}`,
            {
                headers: {
                    Authorization: `Bearer ${idToken}`
                }
            }
        );

        $("#logoutButton").on("click", function () {
            sessionStorage.clear();
            window.location.href = "login.html";
        });

    } catch (error) {
        alert("Unable to verify administrator account.");
        sessionStorage.clear();
        window.location.href = "login.html";
    }

});
