(function () {
  "use strict";

  const API = window.QS_API;

  function qs(selector) {
    return document.querySelector(selector);
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function displayMessage(element, message, type) {
    element.textContent = message;
    element.className = `message ${type}`;
    element.style.display = "block";
  }

  function clearMessages(loginMessage, registerMessage) {
    loginMessage.style.display = "none";
    registerMessage.style.display = "none";
  }

  function getPostLoginUrl(role) {
    const redirectParam = new URLSearchParams(window.location.search).get("redirect");
    const fallback = String(role || "").toLowerCase() === "admin"
      ? "/pages/admin/dashboard.html"
      : "/pages/user/index.html";

    if (!redirectParam) return fallback;
    if (!redirectParam.startsWith("/") && !redirectParam.startsWith("pages/")) return fallback;
    if (redirectParam.includes("..")) return fallback;
    return redirectParam.startsWith("/") ? redirectParam : "/" + redirectParam;
  }

  function initTogglePanels(container, loginMessage, registerMessage) {
    const registerBtn = qs(".register-btn");
    const loginBtn = qs(".login-btn");

    registerBtn.addEventListener("click", () => {
      container.classList.add("active");
      clearMessages(loginMessage, registerMessage);
    });

    loginBtn.addEventListener("click", () => {
      container.classList.remove("active");
      clearMessages(loginMessage, registerMessage);
    });
  }

  function initPasswordToggles() {
    document.querySelectorAll(".password-toggle-icon").forEach((icon) => {
      icon.addEventListener("click", () => {
        const targetId = icon.getAttribute("data-target");
        const passwordInput = byId(targetId);
        if (passwordInput.type === "password") {
          passwordInput.type = "text";
          icon.classList.replace("bxs-show", "bxs-hide");
        } else {
          passwordInput.type = "password";
          icon.classList.replace("bxs-hide", "bxs-show");
        }
      });
    });
  }

  function initLogin(loginForm, loginMessage, registerMessage) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearMessages(loginMessage, registerMessage);

      // We updated the HTML to have loginEmail
      const emailInput = byId("loginEmail");
      const passwordInput = byId("loginPassword");
      
      const email = emailInput ? emailInput.value.trim() : byId("loginUsername").value.trim();
      const password = passwordInput.value;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        displayMessage(loginMessage, "Invalid email address format.", "error");
        return;
      }
      if (password.length < 6) {
        displayMessage(loginMessage, "Password must be at least 6 characters.", "error");
        return;
      }

      try {
        const result = await API.auth.login(email, password);
        API.setSession(result);

        displayMessage(loginMessage, `Welcome back, ${result.user.fullName}! Redirecting...`, "success");
        setTimeout(() => {
          window.location.href = getPostLoginUrl(result.user.role);
        }, 900);
      } catch (err) {
        displayMessage(loginMessage, err.message || "Login failed.", "error");
      }
    });
  }

  function initRegister(registerForm, loginMessage, registerMessage, container) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearMessages(loginMessage, registerMessage);

      const username = byId("registerUsername").value.trim();
      const email = byId("registerEmail").value.trim();
      const password = byId("registerPassword").value;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (username.length < 3) {
        displayMessage(registerMessage, "Name must be at least 3 characters.", "error");
        return;
      }
      if (!emailRegex.test(email)) {
        displayMessage(registerMessage, "Invalid email address format.", "error");
        return;
      }
      // Password must be >= 6 chars, containing at least one letter and one number
      if (password.length < 6 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
        displayMessage(registerMessage, "Password must be >= 6 chars & contain letters/numbers.", "error");
        return;
      }

      try {
        const result = await API.auth.register(username, email, password);
        // Backend returns a token immediately on registration — use it to auto-login.
        API.setSession(result);
        displayMessage(registerMessage, `Welcome, ${username}! Redirecting…`, "success");
        setTimeout(() => {
          window.location.href = getPostLoginUrl(result.user?.role);
        }, 900);
      } catch (err) {
        displayMessage(registerMessage, err.message || "Registration failed.", "error");
      }
    });
  }

  function init() {
    const container = qs(".container");
    const loginForm = byId("loginForm");
    const registerForm = byId("registerForm");
    const loginMessage = byId("loginMessage");
    const registerMessage = byId("registerMessage");

    initTogglePanels(container, loginMessage, registerMessage);
    initPasswordToggles();
    initLogin(loginForm, loginMessage, registerMessage);
    initRegister(registerForm, loginMessage, registerMessage, container);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
