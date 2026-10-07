# Twilio SMS Setup Manual

This project sends Mobile Money payment instructions by SMS through Twilio.

## 1. Create a Twilio account

1. Open https://www.twilio.com/try-twilio.
2. Create and verify your account.
3. Verify your own phone number when Twilio asks.
4. Open the Twilio Console.

## 2. Get a Twilio phone number

1. Open **Phone Numbers > Buy a number**.
2. Choose a number with **SMS** capability.
3. Copy the number in international format, for example `+15005550006`.
4. On a trial account, add the customer phone number under **Verified Caller IDs** before testing.

## 3. Copy the Twilio credentials

In the Twilio Console dashboard, copy:

- **Account SID**: starts with `AC`
- **Auth Token**: keep this private
- **Twilio phone number**: the SMS-capable number you purchased

Never commit the Auth Token to Git or paste it into chat.

## 4. Configure this project

Create the local environment file if it does not exist:

```powershell
Copy-Item .env.example .env
```

Open `.env` and set these values:

```env
TWILIO_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-real-auth-token
TWILIO_FROM_NUMBER=+15005550006
MOMO_ACCOUNT_NUMBER=2267783
MOMO_ACCOUNT_NAME=Rivoshoppa
```

Replace the Twilio example values with the real values from your console. Keep the MoMo account number as `2267783`.

## 5. Install and start the server

From the project folder:

```powershell
npm install
npm start
```

The API should start at `http://localhost:4000`.

## 6. Test an SMS

1. Open the website checkout page.
2. Add an item to the cart.
3. Select **MTN Mobile Money** or **Airtel Money**.
4. Enter the customer's phone number.
   - Use international format when possible: `+2507XXXXXXXX`.
   - Local Rwanda numbers such as `078XXXXXXX` are converted automatically.
5. Submit the order.
6. The SMS should tell the customer to pay the order total to MoMo account `2267783`.

## Common errors

### `Twilio not configured`

Check that `.env` exists in the same folder as `server.js`, and that all three `TWILIO_*` values are filled in. Restart the server after editing `.env`.

### `Authenticate`

The Account SID or Auth Token is incorrect. Copy both again from the Twilio Console.

### `The From phone number ... is not a valid Twilio number`

`TWILIO_FROM_NUMBER` must be the Twilio number purchased in your account, not the customer's number.

### Trial account restrictions

Twilio trial accounts can only send to verified recipient numbers and may add a trial message to the SMS. Verify the customer's number in the Twilio Console or upgrade the account.

### SMS is sent but the order remains awaiting payment

This is expected. The SMS sends payment instructions. Automatic confirmation after the customer pays requires an official MTN/Airtel Mobile Money API or payment webhook; Twilio only sends the message.
