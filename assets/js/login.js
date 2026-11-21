
$(document).ready(function () {

    $("#loginForm").on("submit", async function (event) {
        event.preventDefault();

        const email = $("#email").val().trim();
        const password = $("#password").val();
        const message = $("#message");

        try {
            message.text("Signing in...");

            const response = await axios.post(
                `${AUTH_URL}/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`,
                {
                    email: email,
                    password: password,
                    returnSecureToken: true
                }
            );

            const idToken = response.data.idToken;
            const refreshToken = response.data.refreshToken;
            const userId = response.data.localId;

            sessionStorage.setItem("idToken", idToken);
            sessionStorage.setItem("refreshToken", refreshToken);
            sessionStorage.setItem("userId", userId);
            sessionStorage.setItem("email", response.data.email);

            message.text("Login successful! Redirecting...");

            const adminUid = "QKdT5r533FSmguo60EmawgsvwD62";

if (userId === adminUid) {
    window.location.href = "admin-dashboard.html";
} else {
    window.location.href = "dashboard.html";
}

        } catch (error) {
            const errorMessage =
                error.response?.data?.error?.message || "Login failed.";

            if (errorMessage === "INVALID_LOGIN_CREDENTIALS") {
                message.text("Invalid email or password.");
            } else {
                message.text(errorMessage);
            }
        }
    });

    $("#forgotPassword").on("click", async function (event) {
        event.preventDefault();

        const email = $("#email").val().trim();

        if (!email) {
            $("#message").text("Enter your email address first.");
            return;
        }

        try {
            await axios.post(
                `${AUTH_URL}/accounts:sendOobCode?key=${firebaseConfig.apiKey}`,
                {
                    requestType: "PASSWORD_RESET",
                    email: email
                }
            );

            $("#message").text("Password reset email sent.");

        } catch (error) {
            $("#message").text("Unable to send reset email. Check the email address.");
        }
    });

});
