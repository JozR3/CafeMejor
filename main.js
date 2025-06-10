let productos = [];

const admin = {
  nombre: "Administrador",
  correo: "admin@admin.com",
  password: "admin123",
  isAdmin: true
};
const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
const existeAdmin = usuarios.some(u => u.correo === admin.correo && u.isAdmin);

if (!existeAdmin) {
  usuarios.push(admin);
  localStorage.setItem("usuarios", JSON.stringify(usuarios));
}

fetch("./productos.json")
  .then(response => response.json())
  .then(data => {
    const productosGuardados = JSON.parse(localStorage.getItem("productos-agregados")) || [];
    const idsModificados = productosGuardados.map(p => p.id);
    const dataFiltrada = data.filter(p => !idsModificados.includes(p.id));

    productos = [...dataFiltrada, ...productosGuardados];

    const params = new URLSearchParams(window.location.search);
    const categoriaURL = params.get("categoria");

    const submenuCat = document.getElementById("categorias-submenu");

    if (categoriaURL && categoriaURL !== "todos") {
      productosFiltradosPorCategoria = productos.filter(p => p.categoria.id === categoriaURL);
      tituloPrincipal.innerText = productosFiltradosPorCategoria[0]?.categoria.nombre || "Categoría";
      cargarProductos(productosFiltradosPorCategoria);

      const botonAct = document.getElementById(categoriaURL);
      if (botonAct) {
        botonesCategorias.forEach(b => b.classList.remove("active"));
        botonAct.classList.add("active");
      }

      if (submenuCat) submenuCat.style.display = "block";

    } else {
      productosFiltradosPorCategoria = [...productos];
      tituloPrincipal.innerText = "Todos los productos";
      cargarProductos(productos);

      const botonTodos = document.getElementById("todos");
      if (botonTodos) {
        botonesCategorias.forEach(b => b.classList.remove("active"));
        botonTodos.classList.add("active");
      }
    }
  });

const params = new URLSearchParams(window.location.search);
const categoriaURL = params.get("categoria");

if (categoriaURL && categoriaURL !== "todos") {
  setTimeout(() => {
    const boton = document.getElementById(categoriaURL);
    if (boton) boton.click();
  }, 100);
}
const contenedorProductos = document.querySelector("#contenedor-productos");
const botonesCategorias = document.querySelectorAll(".boton-categoria");
const tituloPrincipal = document.querySelector("#titulo-principal");
let botonesAgregar = document.querySelectorAll(".producto-agregar");
const numerito = document.querySelector("#numerito");

const esAdmin = localStorage.getItem("isAdmin") === "true";

function cargarProductos(productosElegidos) {
  contenedorProductos.innerHTML = "";

  productosElegidos.forEach(producto => {
    const div = document.createElement("div");
    div.classList.add("producto");

    const enCarrito = productosEnCarrito.find(p => p.id === producto.id);
    const cantidadEnCarrito = enCarrito ? enCarrito.cantidad : 0;
    const stockActual = producto.stock - cantidadEnCarrito;
    const botonDeshabilitado = stockActual <= 0 ? "disabled" : "";

    div.innerHTML = `
      <img class="producto-imagen" src="${producto.imagen}" alt="${producto.titulo}">
      <div class="producto-detalles">
        <h3 class="producto-titulo">${producto.titulo}</h3>
        <p class="producto-descripcion">${producto.descripcion || ""}</p>
        <p class="producto-precio">$${producto.precio}</p>
        <p class="producto-stock">Stock disponible: ${stockActual}</p>

        <button class="producto-boton" onclick="abrirModalComprar('${producto.id}')" ${botonDeshabilitado}>Comprar</button>
        ${esAdmin ? `

        <div class="admin-icons">
        <button class="icono-editar" onclick="editarProducto('${producto.id}')" title="Editar">
        <i class="bi bi-pencil-square"></i></button>
        <button class="icono-eliminar" onclick="eliminarProducto('${producto.id}')" title="Eliminar">
        <i class="bi bi-x-circle"></i></button>
        
        </div>
        ` : ""}
      </div>
    `;

    contenedorProductos.append(div);
  });

  actualizarBotonesAgregar();
}

botonesCategorias.forEach(boton => {
  boton.addEventListener("click", (e) => {
    botonesCategorias.forEach(b => b.classList.remove("active"));
    e.currentTarget.classList.add("active");

    buscadorInput.value = ""; // Limpiar buscador al cambiar categoría

    if (e.currentTarget.id !== "todos") {
      productosFiltradosPorCategoria = productos.filter(p => p.categoria.id === e.currentTarget.id);
      tituloPrincipal.innerText = productosFiltradosPorCategoria[0]?.categoria.nombre || "";
      cargarProductos(productosFiltradosPorCategoria);
    } else {
      productosFiltradosPorCategoria = [...productos];
      tituloPrincipal.innerText = "Todos los productos";
      cargarProductos(productos);
    }
  });
});

function actualizarBotonesAgregar() {
  botonesAgregar = document.querySelectorAll(".producto-agregar");

  botonesAgregar.forEach(boton => {
    boton.addEventListener("click", agregarAlCarrito);
  });
}

let productosEnCarrito = [];

let productosEnCarritoLS = localStorage.getItem("productos-en-carrito");
if (productosEnCarritoLS) {
  productosEnCarrito = JSON.parse(productosEnCarritoLS);
  actualizarNumerito();
}

function agregarAlCarrito(e, cantidadAgregar = 1) {
  const idBoton = typeof e === "string" ? e : e.currentTarget.id;
  const producto = productos.find(p => p.id === idBoton);
  if (!producto) return;

  const existente = productosEnCarrito.find(p => p.id === idBoton);
  const cantidadEnCarrito = existente ? existente.cantidad : 0;

  if (cantidadEnCarrito + cantidadAgregar > producto.stock) {
    Toastify({
      text: "No hay suficiente stock disponible.",
      duration: 3000,
      gravity: "bottom",
      position: "right",
      style: { background: "#dc3545" }
    }).showToast();
    return;
  }

  Toastify({
    text: "Producto agregado",
    duration: 3000,
    close: true,
    gravity: "top",
    position: "right",
    stopOnFocus: true,
    style: {
      background: "linear-gradient(to right, #4b33a8, #785ce9)",
      borderRadius: "2rem",
      textTransform: "uppercase",
      fontSize: ".75rem"
    },
    offset: { x: '1.5rem', y: '1.5rem' }
  }).showToast();

  if (existente) {
    existente.cantidad += cantidadAgregar;
  } else {
    productosEnCarrito.push({ ...producto, cantidad: cantidadAgregar });
  }

  actualizarNumerito();
  localStorage.setItem("productos-en-carrito", JSON.stringify(productosEnCarrito));
  cargarProductos(productos);
}

function actualizarNumerito() {
  const total = productosEnCarrito.reduce((acc, p) => acc + p.cantidad, 0);
  numerito.innerText = total;
}

// Admin: Eliminar producto
function eliminarProducto(id) {
  Swal.fire({
    title: '¿Estás seguro?',
    text: "Esta acción eliminará el producto permanentemente.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      productos = productos.filter(p => p.id !== id);

      let guardados = JSON.parse(localStorage.getItem("productos-agregados")) || [];
      guardados = guardados.filter(p => p.id !== id);
      localStorage.setItem("productos-agregados", JSON.stringify(guardados));

      cargarProductos(productos);

      Swal.fire({
        title: 'Eliminado',
        text: 'El producto fue eliminado correctamente.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    }
  });
}

// Admin: Editar producto
function editarProducto(id) {
  const producto = productos.find(p => p.id === id);
  if (!producto) return;

  document.getElementById("nuevo-titulo").value = producto.titulo;
  document.getElementById("nuevo-categoria").value = producto.categoria.id;
  document.getElementById("nuevo-precio").value = producto.precio;
  document.getElementById("nuevo-stock").value = producto.stock;
  document.getElementById("nuevo-descripcion").value = producto.descripcion || "";

  const tipoImagenSelect = document.getElementById("tipo-imagen");
  const imagenInput = document.getElementById("nuevo-imagen");
  const fileInput = document.getElementById("imagen-file");
  const preview = document.getElementById("imagen-preview");

  // Detectar si es base64 (archivo) o URL
  if (producto.imagen.startsWith("data:")) {
    tipoImagenSelect.value = "archivo";
    document.getElementById("contenedor-url").style.display = "none";
    document.getElementById("contenedor-archivo").style.display = "block";

    preview.src = producto.imagen;
    preview.style.display = "block";
  } else {
    tipoImagenSelect.value = "url";
    document.getElementById("contenedor-url").style.display = "block";
    document.getElementById("contenedor-archivo").style.display = "none";

    imagenInput.value = producto.imagen;
    preview.src = producto.imagen;
    preview.style.display = "block";
  }

  imagenInput.dataset.imagenOriginal = producto.imagen;

  document.getElementById("formulario-titulo").textContent = "Editar Producto";
  document.getElementById("modal-producto").style.display = "flex";
  document.getElementById("formulario-admin").dataset.editando = id;
}

// Agregar producto desde el formulario
document.addEventListener("DOMContentLoaded", () => {
  const formularioAdmin = document.getElementById("formulario-admin");
  const imagenInput = document.getElementById("nuevo-imagen");
  const fileInput = document.getElementById("imagen-file");
  const preview = document.getElementById("imagen-preview");

  // Vista previa desde URL
  imagenInput.addEventListener("input", () => {
    if (imagenInput.value.trim()) {
      preview.src = imagenInput.value;
      preview.style.display = "block";
    }
  });

  // Vista previa desde archivo local
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        preview.src = e.target.result;
        preview.style.display = "block";
      };
      reader.readAsDataURL(file);
    }
  });

  // Evento de agregar producto
  if (formularioAdmin) {
    formularioAdmin.addEventListener("submit", (e) => {
      e.preventDefault();

      const titulo = document.getElementById("nuevo-titulo").value.trim();
      const descripcion = document.getElementById("nuevo-descripcion").value.trim();
      const categoriaId = document.getElementById("nuevo-categoria").value;
      const precio = parseFloat(document.getElementById("nuevo-precio").value);
      const stock = parseInt(document.getElementById("nuevo-stock").value);
      const imagenURL = imagenInput.value.trim();
      const imagenFile = fileInput.files[0];

      if (!titulo || !categoriaId || isNaN(precio) || precio <= 0 || isNaN(stock) || stock < 0) {
        alert("Todos los campos son obligatorios y deben ser válidos.");
        return;
      }
      /* AGREGADO */
      if (titulo.length > 25) {
        alert("El título debe contener 25 caracteres como máximo.");
        return;
      }
      if (descripcion.length > 60) {
        alert("La descripción debe contener 60 caracteres como máximo");
        return;
      }
      if (precio > 30000 || precio < 100) {
        alert("Debe ingresar un precio razonable.");
        return;
      }
      if (stock > 200 || stock < 0) {
        alert("Debe ingresar un stock razonable.");
        return;
      }
      /* */
      const tipoImagen = document.getElementById("tipo-imagen").value;
      let imagenFinal = "";

      if (tipoImagen === "archivo") {
        if (imagenFile) {
          const reader = new FileReader();
          reader.onload = function (e) {
            crearProducto(titulo, descripcion, categoriaId, precio, stock, e.target.result);
          };
          reader.readAsDataURL(imagenFile);
          return;
        } else {
          imagenFinal = imagenInput.dataset.imagenOriginal || "";
        }
      } else {
        imagenFinal = imagenURL || imagenInput.dataset.imagenOriginal || "";
      }

      crearProducto(titulo, descripcion, categoriaId, precio, stock, imagenFinal);
    });
  }

  function crearProducto(titulo, descripcion, categoriaId, precio, stock, imagen) {
    const idEditando = document.getElementById("formulario-admin").dataset.editando;
    let idFinal;
    if (idEditando) {
      idFinal = idEditando;
      const indexOriginal = productos.findIndex(p => p.id === idFinal);
      if (indexOriginal !== -1) {
        productos.splice(indexOriginal, 1);
      }
      let guardados = JSON.parse(localStorage.getItem("productos-agregados")) || [];
      const indexGuardado = guardados.findIndex(p => p.id === idFinal);
      if (indexGuardado !== -1) {
        guardados.splice(indexGuardado, 1);
      }
      localStorage.setItem("productos-agregados", JSON.stringify(guardados));
    } else {
      const random = Math.random().toString(36).substring(2, 6);
      idFinal = `${categoriaId}-${random}`;
    }

    const nuevoProducto = {
      id: idFinal,
      titulo,
      descripcion,
      imagen,
      categoria: {
        id: categoriaId,
        nombre: categoriaId.charAt(0).toUpperCase() + categoriaId.slice(1)
      },
      precio,
      stock
    };

    productos.push(nuevoProducto);

    const guardados = JSON.parse(localStorage.getItem("productos-agregados")) || [];
    guardados.push(nuevoProducto);
    localStorage.setItem("productos-agregados", JSON.stringify(guardados));

    document.getElementById("formulario-admin").reset();
    preview.style.display = "none";
    document.getElementById("modal-producto").style.display = "none";
    document.getElementById("formulario-admin").removeAttribute("data-editando");
    cargarProductos(productos);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

const buscadorInput = document.getElementById("buscador");
let productosFiltradosPorCategoria = [...productos];

if (buscadorInput) {
  buscadorInput.addEventListener("input", () => {
    const termino = buscadorInput.value.trim().toLowerCase();

    const resultado = productosFiltradosPorCategoria.filter(p => {
      const titulo = p.titulo.toLowerCase();
      const categoria = p.categoria.nombre.toLowerCase();
      const precio = p.precio.toString();

      return (
        titulo.includes(termino) ||
        categoria.includes(termino) ||
        precio.includes(termino)
      );
    });

    cargarProductos(resultado);
  });
}

//Modal para productos
const modal = document.getElementById("modal-comprar");
const modalImg = document.getElementById("modal-img");
const modalTitulo = document.getElementById("modal-titulo");
const modalDescripcion = document.getElementById("modal-descripcion");
const modalPrecio = document.getElementById("modal-precio");
const cantidadSpan = document.getElementById("cantidad-producto");
let cantidad = 1;
let productoSeleccionado = null;
let stockActual = 0;
function abrirModalComprar(id) {
  productoSeleccionado = productos.find(p => p.id === id);
  if (!productoSeleccionado) return;

  modalImg.src = productoSeleccionado.imagen;
  modalTitulo.textContent = productoSeleccionado.titulo;
  modalDescripcion.textContent = productoSeleccionado.descripcion || "Sin descripción.";
  modalPrecio.textContent = `$${productoSeleccionado.precio}`;

  const enCarrito = productosEnCarrito.find(p => p.id === productoSeleccionado.id);
  const cantidadEnCarrito = enCarrito ? enCarrito.cantidad : 0;
  stockActual = productoSeleccionado.stock - cantidadEnCarrito;

  document.getElementById("modal-stock").textContent = `Stock disponible: ${stockActual}`;

  cantidad = 1;
  cantidadSpan.textContent = cantidad;

  modal.style.display = "flex";
}

document.getElementById("cerrar-modal")?.addEventListener("click", () => modal.style.display = "none");
document.querySelector(".cerrar-modal").addEventListener("click", () => modal.style.display = "none");

document.getElementById("sumar-cantidad").addEventListener("click", () => {
  if (cantidad < stockActual) {
    cantidad++;
    cantidadSpan.textContent = cantidad;
  }
});

document.getElementById("restar-cantidad").addEventListener("click", () => {
  if (cantidad > 1) {
    cantidad--;
    cantidadSpan.textContent = cantidad;
  }
});

document.getElementById("agregar-al-carrito").addEventListener("click", () => {
  if (cantidad <= stockActual) {
    agregarAlCarrito(productoSeleccionado.id, cantidad);
    modal.style.display = "none";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuario-logueado"));
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const botonMisCompras = document.getElementById("mis-compras-li");

  if (usuario && !isAdmin && botonMisCompras) {
    botonMisCompras.style.display = "block";
  }
});