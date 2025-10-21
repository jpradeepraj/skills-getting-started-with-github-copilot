document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants section manually so we can attach delete handlers
        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsHeader = document.createElement("h5");
        participantsHeader.textContent = "Participants";
        participantsSection.appendChild(participantsHeader);

        if (details.participants && details.participants.length > 0) {
          const ul = document.createElement("ul");
          ul.className = "participants-list";

          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const emailSpan = document.createElement("span");
            emailSpan.textContent = p;
            emailSpan.className = "participant-email";

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "participant-delete";
            deleteBtn.setAttribute("aria-label", `Remove ${p}`);
            deleteBtn.innerHTML = `\u2716`; // small × character as icon

            // Delete handler
            deleteBtn.addEventListener("click", async (e) => {
              e.preventDefault();
              // Confirm quick action
              const confirmed = confirm(`Remove ${p} from ${name}?`);
              if (!confirmed) return;

              try {
                const res = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(p)}`,
                  { method: "DELETE" }
                );

                const json = await res.json();
                if (res.ok) {
                  // Remove list item from DOM
                  li.remove();
                  messageDiv.textContent = json.message;
                  messageDiv.className = "message success";
                  messageDiv.classList.remove("hidden");

                  // Update availability text if present
                  const avail = activityCard.querySelector(".availability");
                  if (avail) {
                    const newSpots = details.max_participants - (details.participants.length - 1);
                    avail.textContent = `${newSpots} spots left`;
                  }

                  // Also update the in-memory details.participants array locally to keep UI consistent
                  const idx = details.participants.indexOf(p);
                  if (idx !== -1) details.participants.splice(idx, 1);

                  setTimeout(() => messageDiv.classList.add("hidden"), 4000);
                } else {
                  messageDiv.textContent = json.detail || "Failed to remove participant";
                  messageDiv.className = "message error";
                  messageDiv.classList.remove("hidden");
                  setTimeout(() => messageDiv.classList.add("hidden"), 4000);
                }
              } catch (err) {
                console.error("Error removing participant:", err);
                messageDiv.textContent = "Failed to remove participant. Please try again.";
                messageDiv.className = "message error";
                messageDiv.classList.remove("hidden");
                setTimeout(() => messageDiv.classList.add("hidden"), 4000);
              }
            });

            li.appendChild(emailSpan);
            li.appendChild(deleteBtn);
            ul.appendChild(li);
          });

          participantsSection.appendChild(ul);
        } else {
          const pInfo = document.createElement("p");
          pInfo.className = "info";
          pInfo.textContent = "No participants yet. Be the first to sign up!";
          participantsSection.appendChild(pInfo);
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();

        // Refresh activities list so the new participant appears immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
