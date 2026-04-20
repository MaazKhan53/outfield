export default function DeleteAccount() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px", fontFamily: "sans-serif", color: "#e8e8e8", background: "#040608", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Delete Your Account</h1>
      <p style={{ color: "#999", marginBottom: 32 }}>Outfield — Account Deletion Request</p>

      <p>If you would like to delete your Outfield account and associated personal data, please send an email to <a href="mailto:outfield.application@gmail.com" style={link}>outfield.application@gmail.com</a> with the subject line <strong>"Account Deletion Request"</strong> and include the email or phone number linked to your account.</p>

      <h2 style={h2}>What gets deleted</h2>
      <p>Upon receiving your request, the following personal data will be permanently deleted within <strong>30 days</strong>:</p>
      <ul style={ul}>
        <li>Name</li>
        <li>Email address</li>
        <li>Phone number</li>
        <li>Location history</li>
        <li>Profile information</li>
      </ul>

      <h2 style={h2}>What may be retained</h2>
      <p>Booking history and transaction records may be retained beyond 30 days where required for legal, financial, or regulatory compliance purposes. This data will not be used for any other purpose and will be deleted once the retention period expires.</p>

      <h2 style={h2}>Contact</h2>
      <p>For any questions about account deletion, please contact us at <a href="mailto:outfield.application@gmail.com" style={link}>outfield.application@gmail.com</a>.</p>
    </div>
  );
}

const h2 = { fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 8, color: "#fff" };
const ul = { paddingLeft: 24, lineHeight: 1.8 };
const link = { color: "#4ade80" };
