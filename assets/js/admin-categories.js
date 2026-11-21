
$(document).ready(function () {
    const idToken = sessionStorage.getItem("idToken");
    const userId = sessionStorage.getItem("userId");
    const adminUid = "QKdT5r533FSmguo60EmawgsvwD62";

    if (!idToken || userId !== adminUid) {
        alert("Admin access required.");
        window.location.href = "login.html";
        return;
    }

    loadCategories();

    $("#categoryForm").on("submit", async function (event) {
        event.preventDefault();

        const categoryId = $("#categoryId").val();
        const name = $("#categoryName").val().trim();
        const description = $("#categoryDescription").val().trim();

        if (!name || !description) {
            alert("Please fill all fields.");
            return;
        }

        const documentId = categoryId || `CAT${Date.now()}`;

        const categoryData = {
            name: { stringValue: name },
            description: { stringValue: description },
            active: { booleanValue: true },
            createdAt: { timestampValue: new Date().toISOString() }
        };

        try {
            await axios.patch(
                `${FIRESTORE_URL}/categories/${documentId}`,
                { fields: categoryData },
                {
                    headers: {
                        Authorization: `Bearer ${idToken}`
                    }
                }
            );

            alert(categoryId ? "Category updated successfully." : "Category added successfully.");

            $("#categoryForm")[0].reset();
            $("#categoryId").val("");
            $("#saveButton").text("Add Category");

            loadCategories();
        } catch (error) {
            console.error(error.response?.data || error);
            alert("Unable to save category.");
        }
    });

    async function loadCategories() {
        try {
            const response = await axios.post(
                `${FIRESTORE_URL}:runQuery`,
                {
                    structuredQuery: {
                        from: [{ collectionId: "categories" }]
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${idToken}`
                    }
                }
            );

            let html = "";

            response.data.forEach(item => {
                if (!item.document) return;

                const doc = item.document;
                const id = doc.name.split("/").pop();
                const fields = doc.fields;

                const name = fields.name?.stringValue || "";
                const description = fields.description?.stringValue || "";
                const active = fields.active?.booleanValue ?? true;

                html += `
                    <div class="product-card">
                        <h3>${escapeHtml(name)}</h3>
                        <p>${escapeHtml(description)}</p>
                        <p>Status: ${active ? "Active" : "Inactive"}</p>
                        <button class="edit-category" data-id="${escapeHtml(id)}"
                            data-name="${escapeHtml(name)}"
                            data-description="${escapeHtml(description)}">
                            Edit
                        </button>
                        <button class="toggle-category" data-id="${escapeHtml(id)}"
                            data-name="${escapeHtml(name)}"
                            data-description="${escapeHtml(description)}"
                            data-active="${active}">
                            ${active ? "Deactivate" : "Activate"}
                        </button>
                        <button class="delete-category" data-id="${escapeHtml(id)}">
                            Delete
                        </button>
                    </div>
                `;
            });

            $("#categoryList").html(html || "<p>No categories found.</p>");
        } catch (error) {
            console.error(error.response?.data || error);
            $("#categoryList").html("<p>Unable to load categories.</p>");
        }
    }

    $("#categoryList").on("click", ".edit-category", function () {
        $("#categoryId").val($(this).data("id"));
        $("#categoryName").val($(this).attr("data-name"));
        $("#categoryDescription").val($(this).attr("data-description"));
        $("#saveButton").text("Update Category");
        window.scrollTo(0, 0);
    });

    $("#categoryList").on("click", ".toggle-category", async function () {
        const id = $(this).attr("data-id");
        const name = $(this).attr("data-name");
        const description = $(this).attr("data-description");
        const active = $(this).attr("data-active") === "true";

        try {
            await axios.patch(
                `${FIRESTORE_URL}/categories/${id}`,
                {
                    fields: {
                        name: { stringValue: name },
                        description: { stringValue: description },
                        active: { booleanValue: !active }
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${idToken}`
                    }
                }
            );

            loadCategories();
        } catch (error) {
            console.error(error.response?.data || error);
            alert("Unable to update category status.");
        }
    });

    $("#categoryList").on("click", ".delete-category", async function () {
        const id = $(this).attr("data-id");

        if (!confirm("Are you sure you want to delete this category?")) {
            return;
        }

        try {
            await axios.delete(`${FIRESTORE_URL}/categories/${id}`, {
                headers: {
                    Authorization: `Bearer ${idToken}`
                }
            });

            alert("Category deleted successfully.");
            loadCategories();
        } catch (error) {
            console.error(error.response?.data || error);
            alert("Unable to delete category.");
        }
    });

    $("#clearButton").on("click", function () {
        $("#categoryForm")[0].reset();
        $("#categoryId").val("");
        $("#saveButton").text("Add Category");
    });

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }
});
