# Eating Time - Project Context

Eating Time is a food delivery platform where clients can order food from local restaurants.

The system includes three user roles:

## Administrator
Responsible for:
- approving or rejecting restaurant registrations
- blocking/unblocking users
- supervising platform activity

Access:
- web only

---

## Local (Restaurant)
Responsible for:
- managing dishes
- managing discounts and coupons
- defining service schedules
- managing order workflow
- confirming/rejecting orders
- handling complaints
- viewing statistics

Access:
- web only

---

## Client
Responsible for:
- browsing restaurants
- browsing dishes and promotions
- placing orders
- managing delivery points
- viewing order history
- submitting complaints
- rating restaurants

Access:
- web and mobile

---

# Core Features

- Authentication
- Restaurant management
- Dish management
- Discounts and coupons
- Shopping cart
- Order workflow
- Notifications
- Complaint system
- Ratings system
- Statistics dashboards

---

# Frontend Goals

The frontend should prioritize:
- usability
- responsive design
- visual consistency
- simple navigation
- clean interfaces
- modern UX

The system supports:
- dark mode
- light mode

---

# API Communication

The frontend consumes a REST API exposed by the backend.

Main integrations:
- authentication
- orders
- restaurants
- dishes
- notifications
- payments
- complaints

The backend is treated as an external service.