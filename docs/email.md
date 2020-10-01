# Email
This document outlines how email was configured and how it is used to send emails.

## Email Provider
We are using G Suite as our email provider. I created a single user (for myself) but created a group (`contact@relar.app`) to actually send the emails.

## Email Sender
We choose to use [sendgrid](https://sendgrid.com) to send emails. This seemed to be a popular choice and they offered a generous free tier for starting out.

## Firebase Integration
Sendgrid offers a [node package](https://www.npmjs.com/package/@sendgrid/mail) for sending emails.