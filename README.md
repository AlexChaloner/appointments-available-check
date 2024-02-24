A miniproject to check if a visa site has available appointments.

Simple script using javascript, node, and puppeteer script made using Chrome devtools.

## Instructions

Requirements: [node](https://nodejs.org/en/download).

After installing node (and potentially restarting), run `npm install`.

Copy `example.env` and rename it to `.env`. Enter your username and password.

Run `node src/index.js`.


## To-Do List

- [x] Add Puppeteer code for checking appointments in visas-de TLS from UK London (19/02/2024)
- [x] Add logging in to TLS (19/02/2024)
- [x] Add email notifications (20/02/2024)
- [x] Allow multiple email receivers (20/02/2024)
- [x] Add loop to allow checks ongoing forever (21/02/2024)
- [x] Prevent email spamming by adding a toggle (23/02/2024)
- [x] Add To-Do List (24/02/2024)
- [x] Take screenshot when bot thinks a success has occurred (help catch false positives) (24/02/2024)
- [x] Add more rigorous check for if appointments available (24/02/2024)
- [ ] Allow cycling of multiple Group appointment pages, which may allow quicker polling
- [ ] Add checking appointments for visas-be site from UK London.
- [ ] Add instructions in README for Antivirus mail shield self-signed certificate, and refactor for cases where not needed.
- [ ] Create script for automatically creating account
- [ ] Create script for automatically cycling accounts
- [ ] Create script for automatically creating "new group"
- [ ] Add checking appointments for visas-ch and visas-fr from UK London
