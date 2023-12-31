document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);

  // Handle compose form submit
  document
    .querySelector("#compose-form")
    .addEventListener("submit", send_email);
  // By default, load the inbox
  load_mailbox("inbox");
});

async function send_email(event) {
  // prevent the form redirect us to the inbox
  event.preventDefault();
  // get the form
  const recipient = document.querySelector("#compose-recipients").value;
  const subject = document.querySelector("#compose-subject").value;
  const body = document.querySelector("#compose-body").value;

  // call API
  try {
    response = await fetch("/emails", {
      method: "POST",
      body: JSON.stringify({
        recipients: recipient,
        subject: subject,
        body: body,
      }),
    });

    result = await response.json();
    load_mailbox("sent");
  } catch (e) {
    console.log(e);
  }
}

function compose_email() {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#email-content").style.display = "none";

  document.querySelector("#compose-view").style.display = "block";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";
}

async function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#email-content").style.display = "none";

  // Show the mailbox name
  document.querySelector("#emails-view").innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;
  // TOOD
  emails = [];
  try {
    response = await fetch(`/emails/${mailbox}`);
    emails = await response.json();
  } catch (e) {
    console.log(e);
  }
  emails.forEach((email) => {
    const element = document.createElement("div");
    element.classList.add("email-box");
    element.style.margin = "10px";
    element.style.border = "1px solid darkgray";
    element.style.borderRadius = "5px";
    element.style.padding = "5px";
    element.style.cursor = "pointer";
    element.innerHTML = `
    <h6>Sender: ${email.sender}</h6>
    <h6>Recipients: ${email.recipients.toString()} </h6>
    <span><strong>Subject:</strong> ${email.subject} - <strong>Time: </strong>${
      email.timestamp
    }</span>
    `;
    if (email.read === true) {
      element.style.backgroundColor = "lightgray";
    } else {
      element.style.backgroundColor = "white";
    }
    document.querySelector("#emails-view").appendChild(element);

    element.addEventListener("click", () => {
      view_email(email.id, mailbox);
    });
  });
}

async function view_email(id, mailbox) {
  try {
    response = await fetch(`/emails/${id}`);
    email = await response.json();

    if (email.read === false) {
      fetch(`/emails/${email.id}`, {
        method: "PUT",
        body: JSON.stringify({
          read: true,
        }),
      });
    }

    document.querySelector("#emails-view").style.display = "none";
    document.querySelector("#compose-view").style.display = "none";
    document.querySelector("#email-content").style.display = "block";

    element = document.querySelector("#email-content");
    element.innerHTML = `
    <h6>Sender: ${email.sender}</h6>
    <h6>Recipients: ${email.recipients.toString()} </h6>
    <span><strong>Subject:</strong> ${email.subject} - <strong>Time: </strong>${
      email.timestamp
    }</span>
    <hr/>
    <p>${email.body}</p>
    `;

    if (mailbox !== "sent") {
      archiveBtn = document.createElement("button");
      if (!email.archived) {
        archiveBtn.innerHTML = "Archive";
        archiveBtn.className = "btn btn-danger";
      } else {
        archiveBtn.innerHTML = "Un-archive";
        archiveBtn.className = "btn btn-success";
      }
      archiveBtn.addEventListener("click", async function () {
        await fetch(`/emails/${email.id}`, {
          method: "PUT",
          body: JSON.stringify({
            archived: email.archived ? false : true,
          }),
        });
        await load_mailbox("inbox");
      });
      element.appendChild(archiveBtn);

      replyBtn = document.createElement("button");
      replyBtn.innerHTML = "Reply";
      replyBtn.style.marginLeft = "5px";
      replyBtn.className = "btn btn-primary";

      replyBtn.addEventListener("click", async function () {
        compose_email();
        // fill in the form
        document.querySelector("#compose-recipients").value = email.sender;
        document.querySelector(
          "#compose-subject"
        ).value = `Re: ${email.subject}`;
        document.querySelector(
          "#compose-body"
        ).value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}\n`;
      });

      element.appendChild(replyBtn);
    }
  } catch (e) {
    console.log(e);
  }
}
