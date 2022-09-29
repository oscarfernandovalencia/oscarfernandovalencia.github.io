document.body.onload = addElement;

function addElement () {
  // crea un nuevo div
  // y añade contenido
  var fecha=new Date();
  var newDiv = document.createElement("div");
  var newContent = document.createTextNode("|"+fecha.toDateString()+"|"+fecha.getHours()+":"+fecha.getMinutes());
  newDiv.appendChild(newContent); //añade texto al div creado.

  // añade el elemento creado y su contenido al DOM
  var currentDiv = document.getElementById("header");
  document.body.insertBefore(newDiv, currentDiv);
}