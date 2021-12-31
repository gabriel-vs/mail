document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email());

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(email = false) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  if (email != false) {

    // Pre-fills composition fields
    document.querySelector('#compose-recipients').value = `${email.sender}`;
    document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
    document.querySelector('#compose-body').value = `On ${email.timestamp}, ${email.sender} wrote: ${email.body}`;
  } else {

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  }

  // Make a post request to /emails when user sends an email
  document.querySelector('#compose-form').onsubmit = () => {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value,
          read: false,
          archived: false
      })
    })
    .then(response => response.json())

    // Once the email has been sent, redirects to user’s sent mailbox
    .then(() => {
      load_mailbox('sent');
    });
    return false;
  }
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3 id='mailbox-name'>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Show emails from the mailbox
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
        emails.forEach(email => {
          const box = document.createElement('div');
          box.id = 'email-box';
          box.dataset.email = email.id;
          box.innerHTML = `<h5 id='email-sender'>${email.sender}</h5>` + `<h5 id='email-subject'>${email.subject}</h5>` + `<h5 id='email-time'>${email.timestamp}</h5>`;

          // Checks if email was already read
          if (email.read === true) {
            box.style.backgroundColor = 'rgb(230, 230, 230)';
          }
          document.querySelector('#emails-view').append(box);
        });
        document.querySelectorAll('#email-box').forEach(box => {
          box.addEventListener('click', () => view_email(box.dataset.email, mailbox));
        });
    });
}

function view_email(id, mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#email-view').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Loads the email
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    document.querySelector('#email-view').innerHTML = "<h5 style='font-weight:bold; position:relative;'>From: </h5>" + `<h5 style='position:absolute; left:465px; top:110px;'>${email.sender}</h5>` + "<h5 style='font-weight:bold; position:relative;'>To: </h5>" +"<h5 style='font-weight:bold; position:relative;'>Subject: </h5>" + `<h5 style='position:absolute; left:487px; top:174px'>${email.subject}</h5>` + "<h5 style='font-weight:bold; position:relative;'>Timestamp: </h5>" + `<h5 style='position:absolute; left:521px; top:206px'>${email.timestamp}</h5>` + `<h5 style='position: absolute; top:300px;'>${email.body}</h5>`;
    email.recipients.forEach(recipient => {
      document.querySelector('#email-view').innerHTML += `<h5 style='position:absolute; left:440px; top:142px;'>${recipient}</h5>`;
    });

    // Add a <hr>
    document.querySelector('#email-view').innerHTML += '<hr style="position:relative; top:40px">';

    // Mark email as read
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
          read: true
      })
    });

    // Add button Reply
    document.querySelector('#email-view').innerHTML += "<button style='position:absolute; top: 240px;' class='btn btn-sm btn-outline-primary' id='reply'>Reply</button>";

    // Checks if the email being visualized is not in the sent mailbox
    if (mailbox != 'sent'){

      // Add button Archive or Unarchive, depending on the archived status
      if (email.archived === false) {
        document.querySelector('#email-view').innerHTML += "<button style='position:absolute; top: 240px; left: 465px;' class='btn btn-sm btn-outline-primary' id='archive'>Archive</button>";
      } else {
        document.querySelector('#email-view').innerHTML += "<button style='position:absolute; top: 240px; left: 465px;' class='btn btn-sm btn-outline-primary' id='archive'>Unarchive</button>";
      }

      // Archive or Unarchive email
      document.querySelector('#archive').addEventListener('click', () => {
        if (email.archived === false) {
          fetch(`/emails/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: true
            })
          })
          .then(() => {
            load_mailbox('inbox');
          });
        } else {
          fetch(`/emails/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: false
            })
          })
          .then(() => {
            load_mailbox('inbox');
          });
        }
      });
    }

    // When Reply button is pressed
    document.querySelector('#reply').addEventListener('click', () => {
      compose_email(email);
    });
  });
}