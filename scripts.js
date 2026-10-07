const STORAGE_KEY = "cadastro-usuario";

const form = document.querySelector("#registration-form");
const cepInput = document.querySelector("#cep");
const statusMessage = document.querySelector("#form-status");
const addressFields = {
  street: document.querySelector("#street"),
  complement: document.querySelector("#complement"),
  neighborhood: document.querySelector("#neighborhood"),
  city: document.querySelector("#city"),
  state: document.querySelector("#state"),
};

let addressRequest;

function showStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = `status${type ? ` status--${type}` : ""}`;
}

function getFormData() {
  return Object.fromEntries(new FormData(form).entries());
}

function saveFormData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getFormData()));
  } catch (error) {
    console.error("Não foi possível salvar os dados no armazenamento local.", error);
    showStatus("Não foi possível salvar os dados neste navegador.", "error");
  }
}

function restoreFormData() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) return;

    const data = JSON.parse(savedData);
    for (const [name, value] of Object.entries(data)) {
      const field = form.elements.namedItem(name);
      if (field instanceof HTMLInputElement && typeof value === "string") {
        field.value = value;
      }
    }
    showStatus("Dados anteriores restaurados.", "success");
  } catch (error) {
    console.error("Não foi possível restaurar os dados salvos.", error);
    showStatus("Não foi possível restaurar os dados salvos.", "error");
  }
}

async function fillAddressFromCep() {
  const cep = cepInput.value.replace(/\D/g, "");
  if (cep.length !== 8) return;

  if (addressRequest) addressRequest.abort();
  addressRequest = new AbortController();
  showStatus("Buscando endereço…");

  try {
    const response = await fetch(
      `https://viacep.com.br/ws/${cep}/json/`,
      { signal: addressRequest.signal },
    );
    if (!response.ok) {
      throw new Error(`A consulta de CEP falhou (HTTP ${response.status}).`);
    }

    const address = await response.json();
    if (address.erro) {
      showStatus("CEP não encontrado. Confira o número informado.", "error");
      return;
    }

    addressFields.street.value = address.logradouro ?? "";
    addressFields.complement.value = address.complemento ?? "";
    addressFields.neighborhood.value = address.bairro ?? "";
    addressFields.city.value = address.localidade ?? "";
    addressFields.state.value = address.uf ?? "";
    saveFormData();
    showStatus("Endereço preenchido com sucesso.", "success");
  } catch (error) {
    if (error.name === "AbortError") return;
    console.error("Não foi possível consultar o ViaCEP.", error);
    showStatus("Não foi possível buscar o CEP. Tente novamente.", "error");
  }
}

form.addEventListener("input", saveFormData);
cepInput.addEventListener("input", () => {
  cepInput.value = cepInput.value.replace(/\D/g, "").slice(0, 8);
  if (cepInput.value.length === 8) {
    fillAddressFromCep();
  } else if (addressRequest) {
    addressRequest.abort();
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  saveFormData();
  showStatus("Cadastro salvo neste navegador.", "success");
});

restoreFormData();
