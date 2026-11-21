
$(document).ready(function () {

    $("#registerForm").on("submit", async function (event) {
        event.preventDefault();

        const name = $("#name").val().trim();
        const email = $("#email").val().trim();
        const phone = $("#phone").val().trim();
        const password = $("#password").val();
        const confirmPassword = $("#confirmPassword").val();

        const message = $("#message");

        if (password !== confirmPassword) {
            message.text("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            message.text("Password must contain at least 6 characters.");
            return;
        }

        try {
            message.text("Creating your account...");

            const authResponse = await axios.post(
                `${AUTH_URL}/accounts:signUp?key=${firebaseConfig.apiKey}`,
                {
                    email: email,
                    password: password,
                    returnSecureToken: true
                }
            );

            const userId = authResponse.data.localId;
            const idToken = authResponse.data.idToken;

            await axios.patch(
                `${FIRESTORE_URL}/users/${userId}`,
                {
                    fields: {
                        name: { stringValue: name },
                        email: { stringValue: email },
                        phone: { stringValue: phone },
                        role: { stringValue: "customer" },
                        creditLimit: { integerValue: "0" },
                        creditUsed: { integerValue: "0" },
                        active: { booleanValue: true },
                        createdAt: {
                            timestampValue: new Date().toISOString()
                        }
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${idToken}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            message.text("Registration successful! Redirecting to login...");

            setTimeout(function () {
                window.location.href = "login.html";
            }, 1500);

        } catch (error) {
            if (error.response) {
                const errorMessage =
                    error.response.data.error?.message || "Registration failed.";

                message.text(errorMessage);
            } else {
                message.text("Unable to connect. Please try again.");
            }
        }
    });

});
