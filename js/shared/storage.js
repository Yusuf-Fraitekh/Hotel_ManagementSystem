(function () {
  "use strict";

  const KEYS = {
    user: "qs_user",
    bookingDraft: "qs_bookingDraft",
    bookings: "qs_bookings",
    rooms: "qs_rooms",
  };

  function getJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function setJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function remove(key) {
    localStorage.removeItem(key);
  }

  window.QS_STORAGE = {
    KEYS,
    getJson,
    setJson,
    remove,
  };

  // --- ONE-TIME AUTO SEEDER ---
  // Wipes the database and injects initial data
  (function seedDatabase() {
    if (localStorage.getItem("qs_seeded_v1")) return; // already seeded
    
    console.log("Seeding QuickStay Database...");
    localStorage.clear(); // Wipe everything
    
    // 1. Rooms
    const mockRooms = [
      { id:1, name:"Economy Single Room", type:"room", bed:"single", view:"city", floor:"1", maxGuests:"1", price:180, stayType:"flex", tags:["business"], description:"A compact and practical room perfect for solo travelers.", images:["https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1200&q=80"] },
      { id:2, name:"Double Standard", type:"room", bed:"double", view:"city", floor:"2", maxGuests:"2", price:280, stayType:"flex", tags:["couples"], description:"Comfortable double bed room with plenty of natural light.", images:["https://images.unsplash.com/photo-1501117716987-c8e1ecb2108a?auto=format&fit=crop&w=1200&q=80"] },
      { id:3, name:"Twin Sea Breeze", type:"room", bed:"mixed", view:"sea", floor:"2", maxGuests:"2", price:350, stayType:"flex", tags:[], description:"Twin beds with a beautiful side view of the sea.", images:["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"] },
      { id:4, name:"Premium King Ocean", type:"room", bed:"king", view:"sea", floor:"3", maxGuests:"2", price:500, stayType:"flex", tags:["couples", "private"], description:"Spacious room featuring a huge king bed directly facing the coastline.", images:["https://images.unsplash.com/photo-1521193089946-7aa29d1c462c?auto=format&fit=crop&w=1200&q=80"] },
      { id:5, name:"Family City Suite", type:"suite", bed:"mixed", view:"city", floor:"4", maxGuests:"4", price:750, stayType:"family", tags:["family"], description:"Large family suite providing two separate sleeping zones and a living area.", images:["https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80"] },
      { id:6, name:"Royal Horizon Suite", type:"suite", bed:"king", view:"sea", floor:"5", maxGuests:"4", price:1400, stayType:"business", tags:["private", "business", "couples"], description:"The ultimate luxurious experience with private dining and panoramic sea views.", images:["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80"] }
    ];
    setJson(KEYS.rooms, mockRooms);

    // Give today's date context
    const today = new Date();
    const dStr = (offset) => {
        const d = new Date(today);
        d.setDate(d.getDate() + offset);
        return d.toISOString().split('T')[0];
    };

    // 2. Bookings
    const mockBookings = [
      { id: 10001, userId: "ahmed@example.com", userName: "Ahmed Khaled", roomName: "Double Standard", roomId: 2, pricePerNight: 280, checkin: dStr(-5), checkout: dStr(-2), nights: 3, total: 840, stayType: "flex", guests: 2, createdAt: new Date(Date.now() - 600000000).toISOString() },
      { id: 10002, userId: "sara.m@gmail.com", userName: "Sara Mahmoud", roomName: "Premium King Ocean", roomId: 4, pricePerNight: 500, checkin: dStr(-1), checkout: dStr(3), nights: 4, total: 2000, stayType: "flex", guests: 2, createdAt: new Date(Date.now() - 400000000).toISOString() },
      { id: 10003, userId: "khalid.busi@company.com", userName: "Khalid Omer", roomName: "Economy Single Room", roomId: 1, pricePerNight: 180, checkin: dStr(0), checkout: dStr(5), nights: 5, total: 900, stayType: "business", guests: 1, createdAt: new Date(Date.now() - 100000000).toISOString() },
      { id: 10004, userId: "ali.family@yahoo.com", userName: "Ali Hassan", roomName: "Family City Suite", roomId: 5, pricePerNight: 750, checkin: dStr(2), checkout: dStr(5), nights: 3, total: 2250, stayType: "family", guests: 4, createdAt: new Date(Date.now() - 80000000).toISOString() },
      { id: 10005, userId: "ahmed@example.com", userName: "Ahmed Khaled", roomName: "Twin Sea Breeze", roomId: 3, pricePerNight: 350, checkin: dStr(10), checkout: dStr(14), nights: 4, total: 1400, stayType: "flex", guests: 2, createdAt: new Date().toISOString() }
    ];
    setJson(KEYS.bookings, mockBookings);

    // Lock seed so it doesn't run again unless user clicks "purge database" from settings
    localStorage.setItem("qs_seeded_v1", "true");
    console.log("Database seeded successfully.");
  })();
})();
