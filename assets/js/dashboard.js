
$(document).ready(function () {

    const idToken = sessionStorage.getItem("idToken");
    const email = sessionStorage.getItem("email");

    if (!idToken) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    $("#customerEmail").text("Logged in as: " + email);

    $("#logoutButton").on("click", function () {
        sessionStorage.clear();
        window.location.href = "login.html";
    });

});
