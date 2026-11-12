const API_BASE = "http://localhost:8080";
const form = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

if (form) {
  const loginInput = document.getElementById("login");
  const passwordInput = document.getElementById("password");
  const notice = document.getElementById("notice");
  const submit = document.getElementById("submit");

  document.getElementById("toggle-password").addEventListener("click", (event) => {
    const show = passwordInput.type === "password";
    passwordInput.type = show ? "text" : "password";
    event.currentTarget.textContent = show ? "Скрыть" : "Показать";
    event.currentTarget.setAttribute("aria-label", show ? "Скрыть пароль" : "Показать пароль");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    notice.hidden = true;
    const login = loginInput.value.trim();
    if (!login || !passwordInput.value) {
      notice.textContent = "Введите логин и пароль.";
      notice.hidden = false;
      return;
    }
    submit.disabled = true;
    submit.textContent = "Входим...";
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password: passwordInput.value }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Не удалось войти. Проверьте данные.");
      sessionStorage.setItem("golab-login", login);
      window.location.href = "dashboard.html";
    } catch (error) {
      notice.textContent = error instanceof TypeError ? "Не удалось подключиться к серверу. Попробуйте позже." : error.message;
      notice.hidden = false;
    } finally {
      submit.disabled = false;
      submit.textContent = "Войти";
    }
  });
} else if (registerForm) {
  const login = document.getElementById("login");
  const password = document.getElementById("password");
  const notice = document.getElementById("notice");
  const submit = document.getElementById("submit");

  document.getElementById("toggle-password").addEventListener("click", (event) => {
    const show = password.type === "password";
    password.type = show ? "text" : "password";
    event.currentTarget.textContent = show ? "Скрыть" : "Показать";
    event.currentTarget.setAttribute("aria-label", show ? "Скрыть пароль" : "Показать пароль");
  });

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    notice.hidden = true;
    if (!login.value.trim() || !password.value) {
      notice.textContent = "Введите логин и пароль.";
      notice.hidden = false;
      return;
    }
    submit.disabled = true;
    submit.textContent = "Регистрируем…";
    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: login.value.trim(), password: password.value }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const fallback = response.status === 409
          ? "Такой пользователь уже существует"
          : response.status === 400
            ? "Введите логин и пароль."
            : "Не удалось зарегистрироваться. Попробуйте ещё раз.";
        throw new Error(typeof data.message === "string" && data.message.trim() ? data.message : fallback);
      }
      registerForm.hidden = true;
      document.getElementById("register-success").hidden = false;
    } catch (error) {
      notice.textContent = error instanceof TypeError ? "Не удалось подключиться к серверу. Попробуйте позже." : error.message;
      notice.hidden = false;
    } finally {
      submit.disabled = false;
      submit.textContent = "Зарегистрироваться";
    }
  });
} else {
  const login = sessionStorage.getItem("golab-login");
  if (!login) window.location.replace("index.html");
  const username = document.querySelector("[data-username]");
  if (username) username.textContent = login || "";
  document.querySelectorAll("[data-logout]").forEach((button) => button.addEventListener("click", () => {
    sessionStorage.removeItem("golab-login");
    window.location.href = "index.html";
  }));

  const list = document.getElementById("users-list");
  if (list && login) {
    const status = document.getElementById("users-status");
    const retry = document.getElementById("retry-users");
    const loadUsers = async () => {
      status.hidden = false;
      status.textContent = "Загрузка...";
      retry.hidden = true;
      list.replaceChildren();
      try {
        const response = await fetch(`${API_BASE}/users`);
        if (!response.ok) throw new Error();
        const names = await response.json();
        if (!Array.isArray(names)) throw new Error();
        names.forEach((name) => {
          const item = document.createElement("li");
          item.textContent = name;
          list.appendChild(item);
        });
        status.hidden = names.length > 0;
        if (!names.length) status.textContent = "Пользователей пока нет.";
      } catch {
        status.textContent = "Не удалось загрузить пользователей.";
        retry.hidden = false;
      }
    };
    retry.addEventListener("click", loadUsers);
    loadUsers();
  }
}
