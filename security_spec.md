# Hast Kala Security Specification

## 1. Data Invariants
1. **Identity Integrity**: Every user profile (`/users/{userId}`), order (`/orders/{orderId}`), and review (`/reviews/{reviewId}`) must bind its `uid` / `customerId` strictly to `request.auth.uid` on creation and keep it immutable on updates.
2. **No Self-Assigned Privileges**: Newly created `/users/{userId}` documents must have `role == 'customer'`; non-admins cannot modify `role`. Admin privileges are verified solely via `request.auth.token.email_verified == true` matching the bootstrapped admin email or existence in `/admins/{uid}`.
3. **PII Isolation**: Customer names, phone numbers, emails, and delivery addresses in `/users/{userId}` and `/orders/{orderId}` are strictly readable only by the owning user or an authorized administrator. `allow list` on `/orders` enforces `resource.data.customerId == request.auth.uid || isAdmin()`.
4. **Verified Purchaser Reviews**: A review can only be created when the referenced `/orders/{orderId}` exists, belongs to `request.auth.uid`, and has reached `status == 'Delivered'`, and the referenced `/products/{productId}` exists.
5. **Terminal Order Locking**: Once an order reaches `Delivered` or `Cancelled`, customers cannot mutate the order. Customers can only cancel an order while its status is `Order Received`.
6. **Temporal Integrity & Strict Keys**: Every write validates `createdAt == request.time` (on create) and `updatedAt == request.time` (on create and update), enforces `hasAll` + `hasOnly` on create, and `affectedKeys().hasOnly(...)` on action-based updates.

## 2. Adversarial Test Payloads ("Dirty Dozen")
1. **Privilege Escalation**: Customer creates `/users/{uid}` with `role: "admin"` -> `PERMISSION_DENIED`.
2. **Ghost Field Injection**: Customer creates `/orders/{orderId}` with extra `isPaid: true` field -> `PERMISSION_DENIED`.
3. **Spoofed Customer ID**: User A creates `/orders/{orderId}` with `customerId: "userB"` -> `PERMISSION_DENIED`.
4. **Unverified Email Spoof**: Request with admin email claim where `email_verified: false` attempts admin product write -> `PERMISSION_DENIED`.
5. **PII Cross-Read**: Customer A reads `/users/customerB` -> `PERMISSION_DENIED`.
6. **Blanket Order List Scrape**: Customer A runs unrestricted `list` on `/orders` without `customerId` filter -> `PERMISSION_DENIED`.
7. **Unverified Purchaser Review**: User creates `/reviews/{reviewId}` referencing a non-existent or non-Delivered order -> `PERMISSION_DENIED`.
8. **Review Approval Tampering**: Customer updates `/reviews/{reviewId}` trying to flip `approved` after admin hid it -> `PERMISSION_DENIED`.
9. **Terminal State Bypass**: Customer tries to update `/orders/{orderId}` after status is `Shipped` or `Delivered` -> `PERMISSION_DENIED`.
10. **ID Poisoning**: Attacker writes document ID longer than 128 chars or containing invalid characters (`../hack`) -> `PERMISSION_DENIED`.
11. **Timestamp Forgery**: Client submits custom past `createdAt` or `updatedAt` instead of `request.time` -> `PERMISSION_DENIED`.
12. **Catalog Tampering**: Non-admin customer attempts to update `/products/{productId}` price to `1` -> `PERMISSION_DENIED`.
