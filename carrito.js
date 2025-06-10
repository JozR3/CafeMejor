let productosEnCarrito = localStorage.getItem("productos-en-carrito");
productosEnCarrito = JSON.parse(productosEnCarrito);

const contenedorCarritoVacio = document.querySelector("#carrito-vacio");
const contenedorCarritoProductos = document.querySelector("#carrito-productos");
const contenedorCarritoAcciones = document.querySelector("#carrito-acciones");
const contenedorCarritoComprado = document.querySelector("#carrito-comprado");
let botonesEliminar = document.querySelectorAll(".carrito-producto-eliminar");
const botonVaciar = document.querySelector("#carrito-acciones-vaciar");
const contenedorTotal = document.querySelector("#total");
const botonComprar = document.querySelector("#carrito-acciones-comprar");


function cargarProductosCarrito() {
  if (productosEnCarrito && productosEnCarrito.length > 0) {

    contenedorCarritoVacio.classList.add("disabled");
    contenedorCarritoProductos.classList.remove("disabled");
    contenedorCarritoAcciones.classList.remove("disabled");
    contenedorCarritoComprado.classList.add("disabled");

    contenedorCarritoProductos.innerHTML = "";

    productosEnCarrito.forEach(producto => {

      const div = document.createElement("div");
      div.classList.add("carrito-producto");
      div.innerHTML = `
                <img class="carrito-producto-imagen" src="${producto.imagen}" alt="${producto.titulo}">
                <div class="carrito-producto-titulo">
                    <small>Título</small>
                    <h3>${producto.titulo}</h3>
                </div>
                <div class="carrito-producto-cantidad">
                    <small>Cantidad</small>
                    <p>${producto.cantidad}</p>
                </div>
                <div class="carrito-producto-precio">
                    <small>Precio</small>
                    <p>$${producto.precio}</p>
                </div>
                <div class="carrito-producto-subtotal">
                    <small>Subtotal</small>
                    <p>$${producto.precio * producto.cantidad}</p>
                </div>
                <button class="carrito-producto-eliminar" id="${producto.id}"><i class="bi bi-trash-fill"></i></button>
            `;

      contenedorCarritoProductos.append(div);
    })

    actualizarBotonesEliminar();
    actualizarTotal();

  } else {
    contenedorCarritoVacio.classList.remove("disabled");
    contenedorCarritoProductos.classList.add("disabled");
    contenedorCarritoAcciones.classList.add("disabled");
    contenedorCarritoComprado.classList.add("disabled");
  }

}

cargarProductosCarrito();

function actualizarBotonesEliminar() {
  botonesEliminar = document.querySelectorAll(".carrito-producto-eliminar");

  botonesEliminar.forEach(boton => {
    boton.addEventListener("click", eliminarDelCarrito);
  });
}

function eliminarDelCarrito(e) {
  Toastify({
    text: "Producto eliminado",
    duration: 3000,
    close: true,
    gravity: "top", // `top` or `bottom`
    position: "right", // `left`, `center` or `right`
    stopOnFocus: true,
    style: {
      background: "linear-gradient(to right, #4b33a8, #785ce9)",
      borderRadius: "2rem",
      textTransform: "uppercase",
      fontSize: ".75rem"
    },
    offset: {
      x: '1.5rem',
      y: '1.5rem'
    },
    onClick: function () { }
  }).showToast();

  const idBoton = e.currentTarget.id;
  const index = productosEnCarrito.findIndex(producto => producto.id === idBoton);

  productosEnCarrito.splice(index, 1);
  cargarProductosCarrito();

  localStorage.setItem("productos-en-carrito", JSON.stringify(productosEnCarrito));

  if (window.opener) {
    window.opener.location.reload();
  }
}

botonVaciar.addEventListener("click", vaciarCarrito);
function vaciarCarrito() {

  Swal.fire({
    title: '¿Estás seguro?',
    icon: 'question',
    html: `Se van a borrar ${productosEnCarrito.reduce((acc, producto) => acc + producto.cantidad, 0)} productos.`,
    showCancelButton: true,
    focusConfirm: false,
    confirmButtonText: 'Sí',
    cancelButtonText: 'No'
  }).then((result) => {
    if (result.isConfirmed) {
      productosEnCarrito.length = 0;
      localStorage.setItem("productos-en-carrito", JSON.stringify(productosEnCarrito));
      cargarProductosCarrito();
    }
  })
  if (window.opener) {
    window.opener.location.reload();
  }
}


function actualizarTotal() {
  const totalCalculado = productosEnCarrito.reduce((acc, producto) => acc + (producto.precio * producto.cantidad), 0);
  contenedorTotal.innerText = `$${totalCalculado}`;
}


botonComprar.addEventListener("click", comprobarInicio);

/* AGREGADO */
function comprobarInicio() {
  const usuario = localStorage.getItem("usuario-logueado");
  if (!usuario) {
    alert("Debe iniciar sesión para realizar una compra.");
    window.location.href = "login.html";
    return;
  } else {
    comprarCarrito();
  }
}
/* */
function comprarCarrito() {
  const usuario = JSON.parse(localStorage.getItem("usuario-logueado"));
  const fecha = new Date().toLocaleString();

  let todosLosProductos = [];
  fetch("./productos.json")
    .then(response => response.json())
    .then(base => {
      const agregados = JSON.parse(localStorage.getItem("productos-agregados")) || [];
      todosLosProductos = [...base, ...agregados];

      productosEnCarrito.forEach(item => {
        const index = todosLosProductos.findIndex(p => p.id === item.id);
        if (index !== -1) {
          todosLosProductos[index].stock -= item.cantidad;
          if (todosLosProductos[index].stock < 0) {
            todosLosProductos[index].stock = 0;
          }
        }
      });

      const nuevosAgregados = todosLosProductos.filter(p => !base.some(b => b.id === p.id));
      localStorage.setItem("productos-agregados", JSON.stringify(nuevosAgregados));

      // Guardar venta
      const ventas = JSON.parse(localStorage.getItem("ventas")) || [];
      ventas.push({
        usuario: usuario.correo,
        fecha,
        productos: productosEnCarrito.map(p => ({ id: p.id, titulo: p.titulo, cantidad: p.cantidad }))
      });
      localStorage.setItem("ventas", JSON.stringify(ventas));

      // FACTURA completa
      const productosFactura = productosEnCarrito.map(p => ({
        nombre: p.titulo,
        cantidad: p.cantidad,
        precio: p.precio
      }));
      const total = productosFactura.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);

      let facturas = JSON.parse(localStorage.getItem("facturas")) || [];
      const nroFactura = (parseInt(localStorage.getItem("numero-factura")) || 0) + 1;
      localStorage.setItem("numero-factura", nroFactura);

      facturas.push({
        numero: nroFactura,
        fecha,
        usuario: {
          nombre: usuario.nombre || "—",
          dni: usuario.dni || "—",
          direccion: usuario.direccion || "—",
          telefono: usuario.telefono || "—"
          correo: usuario.correo
        },
        productos: productosFactura,
        total
      });

      localStorage.setItem("facturas", JSON.stringify(facturas));

      productosEnCarrito.length = 0;
      localStorage.setItem("productos-en-carrito", JSON.stringify(productosEnCarrito));

      window.location.href = `cobranza.html?nro=${nroFactura}`;
    });
}
