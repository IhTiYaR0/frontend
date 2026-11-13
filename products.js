const grid = document.getElementById('products-grid');
const status = document.getElementById('products-status');
const count = document.getElementById('product-count');
const search = document.getElementById('product-search');
const sort = document.getElementById('product-sort');
const retry = document.getElementById('products-retry');
const priceFormat = new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 });
let products = [];
let catalogRequest = 0;
function renderProducts() {
  const query = search.value.trim().toLocaleLowerCase('ru');
  const visible = products.filter(p => p.Name.toLocaleLowerCase('ru').includes(query));
  if (sort.value !== 'default') visible.sort((a,b) => sort.value === 'asc' ? a.Price-b.Price : b.Price-a.Price);
  grid.replaceChildren();
  count.textContent = `Товаров: ${visible.length}`;
  status.hidden = visible.length > 0;
  status.textContent = products.length ? 'Ничего не найдено. Измените название товара.' : 'Товаров пока нет.';
  for (const product of visible) {
    const article = document.createElement('article');
    article.className = 'product-card';
    const visual = document.createElement('div');
    visual.className = 'product-visual';
    visual.setAttribute('aria-hidden', 'true');
    const mark = document.createElement('span');
    mark.textContent = product.Name;
    visual.append(mark);
    const title = document.createElement('h2'); title.textContent = product.Name;
    const price = document.createElement('p'); price.className = 'product-price'; price.textContent = priceFormat.format(product.Price);
    article.append(visual,title,price); grid.append(article);
  }
}
async function loadProducts() {
  const request = ++catalogRequest;
  status.hidden = false; status.textContent = 'Загружаем товары…'; retry.hidden = true;
  count.textContent = 'Загрузка…'; grid.replaceChildren();
  try {
    const response = await fetch('http://localhost:8080/products');
    if (!response.ok) throw new Error();
    const data = await response.json();
    if (request !== catalogRequest) return;
    if (!Array.isArray(data) || !data.every(p => p && typeof p.Name === 'string' && Number.isFinite(p.Price))) throw new Error();
    products = data; renderProducts();
  } catch {
    if (request !== catalogRequest) return;
    count.textContent = 'Каталог недоступен';
    status.textContent = 'Не удалось загрузить товары. Попробуйте ещё раз.';
    retry.hidden = false;
  }
}
search.addEventListener('input', renderProducts);
sort.addEventListener('change', renderProducts);
retry.addEventListener('click', loadProducts);
loadProducts();

const dialog = document.getElementById('product-dialog');
const addForm = document.getElementById('add-product-form');
const nameInput = document.getElementById('product-name');
const priceInput = document.getElementById('product-price');
const addError = document.getElementById('add-product-error');
const saveButton = document.getElementById('save-product');
let savingProduct = false;
document.getElementById('open-product-dialog').addEventListener('click', () => {
  addError.hidden = true;
  dialog.showModal();
});
function closeProductDialog() { if (!savingProduct) dialog.close(); }
document.getElementById('close-product-dialog').addEventListener('click', closeProductDialog);
document.getElementById('cancel-product').addEventListener('click', closeProductDialog);
dialog.addEventListener('cancel', event => { if (savingProduct) event.preventDefault(); });
addForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (savingProduct) return;
  const Name = nameInput.value.trim();
  const Price = Number(priceInput.value);
  addError.hidden = true;
  if (!Name || !Number.isSafeInteger(Price) || Price <= 0) {
    addError.textContent = 'Укажите название и целую цену больше нуля.';
    addError.hidden = false;
    return;
  }
  savingProduct = true;
  saveButton.disabled = true;
  saveButton.textContent = 'Добавляем…';
  try {
    const response = await fetch('http://localhost:8080/add-product', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Name, Price }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || (response.status === 400 ? 'Проверьте название и цену продукта.' : 'Не удалось добавить продукт. Попробуйте ещё раз.'));
    if (!data || typeof data.Name !== 'string' || !Number.isFinite(data.Price)) throw new Error('Сервер вернул неверный ответ. Обновите каталог перед повторной попыткой.');
    catalogRequest++;
    products = [data, ...products.filter(product => product.ID !== data.ID)];
    search.value = '';
    sort.value = 'default';
    retry.hidden = true;
    renderProducts();
    document.getElementById('product-feedback').textContent = `Продукт «${data.Name}» добавлен.`;
    addForm.reset();
    dialog.close();
  } catch (error) {
    addError.textContent = error instanceof TypeError ? 'Нет связи с сервером. Проверьте подключение и попробуйте ещё раз.' : error.message;
    addError.hidden = false;
  } finally {
    savingProduct = false;
    saveButton.disabled = false;
    saveButton.textContent = 'Добавить';
  }
});
