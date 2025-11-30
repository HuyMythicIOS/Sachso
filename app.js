/* app.js
 - Chứa: dữ liệu mẫu, auth (localStorage), render home, slider, horizontal slider,
   quản lý posts (CRUD) trên admin.html, hỗ trợ loại 'book' cho catalog sách.
*/

/* ---------- Dữ liệu mẫu (chứa users và posts) ---------- */
const SAMPLE_USERS = [
  { username: "admin", password: "123", role: "admin", name: "Admin" },
  { username: "editor", password: "123", role: "editor", name: "Editor" },
  { username: "user", password: "123", role: "user", name: "User" }
];

// posts: id, type, title, excerpt, content, thumbnail, author, status, created_at, plus book fields
const SAMPLE_POSTS = [
  { id: 1, type: "post", title: "Bài viết số 1", excerpt: "Tóm tắt 1", content: "Nội dung chi tiết bài 1", thumbnail: "images/thumbnail.jpg", author: "admin", status: "published", created_at: Date.now() - 1000*60*60*24*3 },
  { id: 2, type: "post", title: "Bài viết số 2", excerpt: "Tóm tắt 2", content: "Nội dung chi tiết bài 2", thumbnail: "images/thumbnail.jpg", author: "editor", status: "published", created_at: Date.now() - 1000*60*60*24*2 },
  { id: 3, type: "post", title: "Bài viết số 3", excerpt: "Tóm tắt 3", content: "Nội dung chi tiết bài 3", thumbnail: "images/thumbnail.jpg", author: "editor", status: "published", created_at: Date.now() - 1000*60*60*24 },
  // sách (catalog)
  { id: 100, type: "book", title: "Sách Số: Lập Trình Web Cơ Bản", author: "Nguyễn Văn A", isbn: "978-1-23456-789-7", price: 120000, rating: 4, excerpt: "Sách hướng dẫn lập trình web cho người mới.", content: "Nội dung & mô tả chi tiết sách, mục lục, ...", thumbnail: "images/books/book1.jpg", status: "published", created_at: Date.now() - 1000*60*60*24*10 },
  { id: 101, type: "book", title: "Ebook: Thiết Kế Giao Diện", author: "Trần Thị B", isbn: "978-0-98765-432-1", price: 90000, rating: 5, excerpt: "Tập trung vào UI/UX cơ bản.", content: "Nội dung sách ebook thiết kế giao diện.", thumbnail: "images/books/book2.jpg", status: "published", created_at: Date.now() - 1000*60*60*24*7 }
];

/* ---------- Helpers lưu & load từ localStorage ---------- */
function ensureData(){
  if(!localStorage.getItem('app_users')) localStorage.setItem('app_users', JSON.stringify(SAMPLE_USERS));
  if(!localStorage.getItem('app_posts')) localStorage.setItem('app_posts', JSON.stringify(SAMPLE_POSTS));
}
ensureData();

function getUsers(){ return JSON.parse(localStorage.getItem('app_users')||'[]'); }
function setUsers(u){ localStorage.setItem('app_users', JSON.stringify(u)); }
function getPosts(){ return JSON.parse(localStorage.getItem('app_posts')||'[]'); }
function setPosts(p){ localStorage.setItem('app_posts', JSON.stringify(p)); }

/* ---------- Auth (giả) ---------- */
function handleLogin(e){
  e.preventDefault();
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value;
  const users = getUsers();
  const found = users.find(x => x.username === u && x.password === p);
  const errEl = document.getElementById('loginError');
  if(!found){
    if(errEl) errEl.innerText = "Sai tài khoản/mật khẩu";
    return;
  }
  // Lưu user vào localStorage (giả token)
  localStorage.setItem('currentUser', JSON.stringify(found));
  // redirect về trang chủ
  window.location.href = 'index.html';
}

function logout(){
  localStorage.removeItem('currentUser');
  // reload để cập nhật hiển thị
  window.location.href = 'index.html';
}

/* ---------- Utility: get current user ---------- */
function currentUser(){
  try{
    return JSON.parse(localStorage.getItem('currentUser') || 'null');
  }catch(e){
    return null;
  }
}

/* ---------- Render user area (header) ---------- */
function renderUserArea(elId='userArea'){
  const area = document.getElementById(elId);
  if(!area) return;
  const user = currentUser();
  if(!user){
    area.innerHTML = `<a href="login.html" class="ghost">Đăng nhập</a>`;
  } else {
    let adminLink = '';
    if(user.role === 'admin' || user.role === 'editor') adminLink = `<a href="admin.html">Quản lý</a>`;
    area.innerHTML = `<span>Xin chào, <strong>${escapeHtml(user.username)}</strong> (${user.role})</span>
                      ${adminLink}
                      <button onclick="logout()">Đăng xuất</button>`;
  }
}

/* ---------- Escape simple ---------- */
function escapeHtml(s){ return (s+'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* ---------- Slider tự động (index.html) ---------- */
let sliderIndex = 1;
function startSlider(){
  const img = document.getElementById('slideImg');
  if(!img) return;
  const total = 3; // images/1.jpg .. images/3.jpg
  setInterval(()=> {
    sliderIndex = (sliderIndex % total) + 1;
    img.src = `images/${sliderIndex}.jpg`;
  }, 3000);
}

/* ---------- Render featured (3 bài) ---------- */
function renderFeatured(){
  const el = document.getElementById('featured');
  if(!el) return;
  const posts = getPosts().filter(p => p.status === 'published').sort((a,b)=> b.created_at - a.created_at);
  const first3 = posts.slice(0,3);
  el.innerHTML = first3.map(p=>`
    <div class="card">
      <img src="${escapeHtml(p.thumbnail||'images/thumbnail.jpg')}" style="width:100%;height:140px;object-fit:cover;border-radius:6px;margin-bottom:8px;" />
      <h3>${escapeHtml(p.title)}</h3>
      <p style="color:var(--muted)">${escapeHtml(p.excerpt)}</p>
      <a href="#" onclick="viewPost(${p.id})">Xem thêm</a>
    </div>`).join('');
}

/* ---------- Render horizontal scroll (trending) ---------- */
function renderHScroll(){
  const el = document.getElementById('hScroll');
  if(!el) return;
  const posts = getPosts().filter(p=>p.status==='published').slice(0,8);
  el.innerHTML = posts.map(p=>`
    <div class="card">
      <img src="${escapeHtml(p.thumbnail||'images/thumbnail.jpg')}" style="width:100%;height:120px;object-fit:cover;border-radius:6px;margin-bottom:8px;" />
      <h4 style="margin:0">${escapeHtml(p.title)}</h4>
      <p style="color:var(--muted);font-size:13px">${escapeHtml(p.excerpt)}</p>
    </div>
  `).join('');
}

/* ---------- Render posts list + load more ---------- */
let postsShown = 3;
function renderPostsList(){
  const el = document.getElementById('posts');
  if(!el) return;
  const posts = getPosts().filter(p=>p.status==='published' && p.type!=='book').sort((a,b)=>b.created_at - a.created_at);
  const shown = posts.slice(0, postsShown);
  el.innerHTML = shown.map(p=>`
    <div class="post">
      <div style="display:flex;gap:12px;">
        <img src="${escapeHtml(p.thumbnail||'images/thumbnail.jpg')}" style="width:140px;height:90px;object-fit:cover;border-radius:6px;" />
        <div style="flex:1">
          <h3 style="margin:0">${escapeHtml(p.title)}</h3>
          <p style="color:var(--muted);margin:6px 0">${escapeHtml(p.excerpt)}</p>
          <a href="#" onclick="viewPost(${p.id})">Xem thêm</a>
        </div>
      </div>
    </div>
  `).join('');
  const loadBtn = document.getElementById('loadMoreBtn');
  if(!loadBtn) return;
  if(postsShown >= posts.length) loadBtn.style.display = 'none'; else loadBtn.style.display = 'inline-block';
}
function loadMore(){ postsShown = 100; renderPostsList(); }

/* ---------- Xem chi tiết bài (bằng cửa sổ mới) ---------- */
function viewPost(id){
  const p = getPosts().find(x=>x.id===id);
  if(!p){ alert('Bài viết không tồn tại'); return; }
  const w = window.open('', '_blank', 'width=800,height=600');
  w.document.write(`<html><head><title>${escapeHtml(p.title)}</title><link rel="stylesheet" href="style.css"></head><body style="padding:20px">`);
  w.document.write(`<h1>${escapeHtml(p.title)}</h1><img src="${escapeHtml(p.thumbnail||'images/thumbnail.jpg')}" style="width:100%;max-height:320px;object-fit:cover"/><p style="color:var(--muted)">${escapeHtml(p.excerpt)}</p>`);
  if(p.type === 'book'){
    w.document.write(`<div style="margin:12px 0;"><strong>Tác giả:</strong> ${escapeHtml(p.author||'—')}</div>`);
    w.document.write(`<div style="margin:6px 0;"><strong>ISBN:</strong> ${escapeHtml(p.isbn||'—')}</div>`);
    w.document.write(`<div style="margin:6px 0;"><strong>Giá:</strong> ${p.price ? (p.price.toLocaleString('vi-VN') + '₫') : 'Miễn phí'}</div>`);
    w.document.write(`<div style="margin:6px 0;"><strong>Rating:</strong> ${p.rating || 0} / 5</div>`);
  }
  w.document.write(`<div style="margin-top:12px">${escapeHtml(p.content)}</div>`);
  w.document.write(`<div style="margin-top:20px"><a href="index.html">Quay lại</a></div>`);
  w.document.write(`</body></html>`);
  w.document.close();
}

/* ---------- ADMIN: render posts quản lý + form xử lý ---------- */
function renderAdminPosts(){
  const el = document.getElementById('adminPosts');
  if(!el) return;
  const posts = getPosts().slice().sort((a,b)=>b.created_at - a.created_at);
  if(posts.length === 0) { el.innerHTML = '<p>Chưa có bài viết</p>'; return; }
  el.innerHTML = posts.map(p=>`
    <div class="card" style="display:flex;justify-content:space-between;align-items:center;">
      <div style="flex:1">
        <strong>${escapeHtml(p.title)}</strong>
        <div style="color:var(--muted);font-size:13px">${escapeHtml(p.excerpt||'')}</div>
        <div style="font-size:12px;color:var(--muted)">Author: ${escapeHtml(p.author||'—')} • ${new Date(p.created_at).toLocaleString()}</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button onclick="editPost(${p.id})">Edit</button>
        <button onclick="deletePost(${p.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function savePost(e){
  e.preventDefault();
  const id = Number(document.getElementById('postId').value);
  const type = document.getElementById('postType').value || 'post';
  const title = document.getElementById('postTitle').value.trim();
  const authorField = document.getElementById('postAuthor').value.trim();
  const isbn = document.getElementById('postISBN').value.trim();
  const price = Number(document.getElementById('postPrice').value) || 0;
  const rating = Number(document.getElementById('postRating').value) || 0;
  const excerpt = document.getElementById('postExcerpt').value.trim();
  const content = document.getElementById('postContent').value.trim();
  const thumb = document.getElementById('postThumb').value.trim() || 'images/thumbnail.jpg';
  const status = document.getElementById('postStatus').value;

  const user = currentUser() || { username: 'guest' };

  let posts = getPosts();
  if(id){ // update
    posts = posts.map(p => p.id === id ? { ...p, type, title, author: authorField || p.author, isbn, price, rating, excerpt, content, thumbnail: thumb, status } : p);
  } else { // create
    const newId = (posts.reduce((s,x)=>Math.max(s,x.id), 0) || 0) + 1;
    posts.unshift({ id: newId, type, title, author: authorField || user.username, isbn, price, rating, excerpt, content, thumbnail: thumb, status, created_at: Date.now() });
  }
  setPosts(posts);
  resetForm();
  renderAdminPosts();
  alert('Lưu thành công');
}

function editPost(id){
  const p = getPosts().find(x=>x.id===id);
  if(!p) return alert('Không tìm thấy post');
  document.getElementById('postId').value = p.id;
  document.getElementById('postType').value = p.type || 'post';
  document.getElementById('postTitle').value = p.title || '';
  document.getElementById('postAuthor').value = p.author || '';
  document.getElementById('postISBN').value = p.isbn || '';
  document.getElementById('postPrice').value = p.price || '';
  document.getElementById('postRating').value = p.rating || '';
  document.getElementById('postExcerpt').value = p.excerpt || '';
  document.getElementById('postContent').value = p.content || '';
  document.getElementById('postThumb').value = p.thumbnail || '';
  document.getElementById('postStatus').value = p.status || 'published';
  window.scrollTo({top:0, behavior:'smooth'});
}

function deletePost(id){
  if(!confirm('Bạn có chắc muốn xóa bài này?')) return;
  let posts = getPosts().filter(p=>p.id!==id);
  setPosts(posts);
  renderAdminPosts();
}

/* ---------- Reset form ---------- */
function resetForm(){
  document.getElementById('postId').value = '';
  document.getElementById('postTitle').value = '';
  document.getElementById('postAuthor').value = '';
  document.getElementById('postISBN').value = '';
  document.getElementById('postPrice').value = '';
  document.getElementById('postRating').value = '';
  document.getElementById('postExcerpt').value = '';
  document.getElementById('postContent').value = '';
  document.getElementById('postThumb').value = '';
  document.getElementById('postStatus').value = 'published';
  document.getElementById('postType').value = 'post';
}

/* ---------- Render users list trên admin ---------- */
function renderAdminUsers(){
  const el = document.getElementById('adminUsers');
  if(!el) return;
  const users = getUsers();
  el.innerHTML = users.map(u=>`
    <div class="card" style="display:flex;justify-content:space-between;align-items:center;">
      <div>
        <strong>${escapeHtml(u.username)}</strong> <span style="color:var(--muted)">(${u.role})</span>
      </div>
      <div style="font-size:12px;color:var(--muted)">${escapeHtml(u.name||'')}</div>
    </div>
  `).join('');
}

/* ---------- Render Catalog (books) ---------- */
function renderCatalog(){
  const containerId = 'catalogContainer';
  let el = document.getElementById(containerId);
  if(!el){
    el = document.createElement('div');
    el.id = containerId;
    el.style.maxWidth = '1100px';
    el.style.margin = '20px auto';
    el.style.padding = '0 16px';
    document.body.insertBefore(el, document.querySelector('footer'));
  }

  const books = getPosts().filter(p => p.type === 'book' && p.status === 'published').sort((a,b)=>b.created_at - a.created_at);
  if(books.length === 0){
    el.innerHTML = '<h2>Catalog sách</h2><p>Hiện chưa có sách.</p>';
    return;
  }

  el.innerHTML = `<h2>Catalog sách</h2><div class="grid-3">` + books.map(b=>`
    <div class="card">
      <img src="${escapeHtml(b.thumbnail||'images/thumbnail.jpg')}" style="width:100%;height:160px;object-fit:cover;border-radius:6px;margin-bottom:8px;" />
      <h3>${escapeHtml(b.title)}</h3>
      <div style="color:var(--muted)">${escapeHtml(b.author||'')}</div>
      <div style="margin:6px 0;color:var(--muted)">ISBN: ${escapeHtml(b.isbn||'—')}</div>
      <div style="font-weight:700">${b.price ? (b.price.toLocaleString('vi-VN') + '₫') : 'Miễn phí'}</div>
      <div style="margin-top:8px;color:var(--muted)">Rating: ${b.rating || 0} / 5</div>
      <p style="color:var(--muted)">${escapeHtml(b.excerpt||'')}</p>
      <a href="#" onclick="viewPost(${b.id})">Xem chi tiết</a>
    </div>
  `).join('') + `</div>`;
}

/* ---------- Page init: chạy khi mở index/admin/login ---------- */
function initPages(){
  ensureData();
  renderUserArea('userArea');
  renderUserArea('adminUserArea'); // admin page header
  startSlider();
  renderFeatured();
  renderHScroll();
  renderPostsList();
  renderAdminPosts();
  renderAdminUsers();
  renderCatalog();

  // Simple RBAC: nếu không phải admin/editor thì chặn admin.html
  if(location.pathname.endsWith('admin.html')){
    const u = currentUser();
    if(!u || !['admin','editor'].includes(u.role)){
      alert('Bạn không có quyền truy cập trang quản lý (admin/editor).');
      window.location.href = 'index.html';
      return;
    }
  }
}

/* ---------- Khởi động khi DOM sẵn sàng ---------- */
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', initPages);
} else {
  initPages();
}
