const grid = document.getElementById('products-grid');
const status = document.getElementById('products-status');
const count = document.getElementById('product-count');
const search = document.getElementById('product-search');
const sort = document.getElementById('product-sort');
const retry = document.getElementById('products-retry');
const priceFormat = new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 });
let products = [];
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
  status.hidden = false; status.textContent = 'Загружаем товары…'; retry.hidden = true;
  count.textContent = 'Загрузка…'; grid.replaceChildren();
  try {
    const response = await fetch('http://localhost:8080/products');
    if (!response.ok) throw new Error();
    const data = await response.json();
    if (!Array.isArray(data) || !data.every(p => p && typeof p.Name === 'string' && Number.isFinite(p.Price))) throw new Error();
    products = data; renderProducts();
  } catch {
    count.textContent = 'Каталог недоступен';
    status.textContent = 'Не удалось загрузить товары. Попробуйте ещё раз.';
    retry.hidden = false;
  }
}
search.addEventListener('input', renderProducts);
sort.addEventListener('change', renderProducts);
retry.addEventListener('click', loadProducts);
loadProducts();
