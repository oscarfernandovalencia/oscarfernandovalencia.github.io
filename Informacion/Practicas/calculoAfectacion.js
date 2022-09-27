// Script para hacer la afectación presupuestal de moñitos en una página html

const formateoPeso = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  })
// Creando tabla
let tabla=document.createElement("table");
let tcabeza=document.createElement("thead");
let tcuerpo=document.createElement("tbody");
tabla.appendChild(tcabeza); tabla.appendChild(tcuerpo);
document.getElementById("cuerpo").appendChild(tabla);
// fin creando tabla
// ####################################################################################################
// creando los valores que irán en la tabla
// '####################################################################################################
// '####<<--------------------VALORES INICIALES BÁSICOS DEL CONTRATO-------------->>####################
// '###################################################################################################
const ObraBasico=23112888698; const AjustesBasico=2197269472;
const ProvisionesBasico=223000000; const DisenosBasico=234000000;
const Ambiental=500000000; const Bioseguridad=180000000;
// '#######################################################################################
// '#########<<-----------VALORES CON LA NUEVA ADICIÓN--------------------->>#############
// '#######################################################################################
const ObraBasicoAdicional=35572718222; const AjustesBasicoAdicional=3443252425;
const Adicion2021=13805970337;
// '#############################################################################################
// '########<<---------Cálculo de los valores totales del contrato INICIALES------------>>#####
// '############################################################################################
const ContratoBasico=ObraBasico+AjustesBasico+ProvisionesBasico;
const IVAContratoBasico = Math.round(ContratoBasico*0.05*0.19/1.3);
const TotalObras=ContratoBasico+IVAContratoBasico;
const IVADisenos=Math.round(DisenosBasico*0.19);
const TotalDisenos=IVADisenos+DisenosBasico;
let TotalContrato=TotalObras+TotalDisenos+Ambiental+Bioseguridad;
// '##############################################################################################
// '########<<---------Cálculo de los valores totales del contrato ADICIONALES------------>>#####
// '##############################################################################################
let ContratoBasicoAdicional=ObraBasicoAdicional+AjustesBasicoAdicional+ProvisionesBasico;
let IVAContratoBasicoadicional = Math.round(ContratoBasicoAdicional*0.05*0.19/1.3);
let TotalObrasAdicional=ContratoBasicoAdicional+IVAContratoBasicoadicional;
let TotalContratoAdicional=TotalObrasAdicional+TotalDisenos+Ambiental+Bioseguridad;
// ############################################################################################
    // Títulos
    // Primero creo los objetos fila y columna
let item=document.createElement("tr"); let texto1=document.createElement("th");
let texto2=document.createElement("th"); let texto3=document.createElement("th");
let texto4=document.createElement("th"); let texto5=document.createElement("th");
let texto6=document.createElement("th"); let texto7=document.createElement("th");
let texto8=document.createElement("th"); let texto9=document.createElement("th");
// Luego creo el contenido de las columnas
texto1.innerHTML="Básico de Obra"; texto2.innerHTML="IVA de Obra";
texto3.innerHTML="Total de Obra"; texto4.innerHTML="Total estudios y diseños";
texto5.innerHTML="Total del contrato"; texto6.innerHTML="Básico de Obra con adición";
texto7.innerHTML="IVA de obra adicional"; texto8.innerHTML="Total de obras con adición";
texto9.innerHTML="Total del contrato con adición";
// agrego los elementos a la fila y a la tabla
item.appendChild(texto1); item.appendChild(texto2);
item.appendChild(texto3); item.appendChild(texto4);
item.appendChild(texto5); item.appendChild(texto6);
item.appendChild(texto7); item.appendChild(texto8);
item.appendChild(texto9); tcabeza.appendChild(item);

    // Valores
// Primero creo los objetos fila y columna
let cifras=document.createElement("tr"); let valor1=document.createElement("td");
let valor2=document.createElement("td"); let valor3=document.createElement("td");
let valor4=document.createElement("td"); let valor5=document.createElement("td");
let valor6=document.createElement("td"); let valor7=document.createElement("td");
let valor8=document.createElement("td"); let valor9=document.createElement("td");
// Luego creo el contenido de las columnas
valor1.innerHTML=formateoPeso.format(ContratoBasico); valor2.innerHTML=formateoPeso.format(IVAContratoBasico);
valor3.innerHTML=TotalObras; valor4.innerHTML=TotalDisenos;
valor5.innerHTML=TotalContrato; valor6.innerHTML=ContratoBasicoAdicional;
valor7.innerHTML=IVAContratoBasicoadicional; valor8.innerHTML=TotalObrasAdicional;
valor9.innerHTML=TotalContratoAdicional;
// agrego los elementos a la fila y a la tabla
cifras.appendChild(valor1); cifras.appendChild(valor2);
cifras.appendChild(valor3); cifras.appendChild(valor4);
cifras.appendChild(valor5); cifras.appendChild(valor6);
cifras.appendChild(valor7); cifras.appendChild(valor8);
cifras.appendChild(valor9); tcuerpo.appendChild(cifras);
// Crear los valores mensuales
// '############################################################################################################################
// '##########<<------------DECLARACIÓN DE VARIABLES ACTAS MENSUALES-------------->>####################
// '##############################################################################################
let MesBasico=new Array(22); let IVAMes=new Array(22);
let MesTotal=new Array(18); let IVAEstudiosDisenosMes=new Array(22);
let EstudiosDisenosMesTotal=new Array(22); let EstudiosDisenosMesBasico=new Array(22);
let Registro=new Array(22); let BioseguridadMesTotal= new Array(22);
let Amortizacion=new Array(22); let Anticipo=new Array(22);
let AcumuladoRP=new Array(22); let SaldoContrato=new Array(22); 
let AcumuladoObraBasico=new Array(22); let TdescontandoA=new Array(22);
let SaldoRP=new Array(22); let Reinicio;
let AcumuladoObra=new Array(22); let AcumuladoActas=new Array(22);
let SaldoAnticipo=new Array(22);
// '##########################################################################################################################
// '########<<------------VALORES DE VIGENCIAS Y ANTICIPOS -------------->>####################
// '##############################################################################################
// '########<--VALOR DEL ANTICIPO INICIAL (50%)------>##########################################
// '#####################################################################################
SaldoAnticipo[0]=12766579085;
// '#####################################################################################
let Vigencia2021=17428206634; let Vigencia2022=9250000000;
SaldoRP[0]=Vigencia2021-SaldoAnticipo[0]; AcumuladoRP[0]=SaldoAnticipo[0];
AcumuladoObra[0]=0; AcumuladoActas[0]=0;
// '##############################################################################################
// '########<<------------VALORES DE LAS ACTAS MENSUALES-------------->>####################
// '##############################################################################################
MesBasico[1]=20800000; MesBasico[2]=5891600; MesBasico[3]=0;
MesBasico[4]=7649200; MesBasico[5]=171054000; MesBasico[6]=482676400;
// '##############################################################################################
// '##<<--------en el mes 7 hubo pago de estudios y diseños-->>###################
// '##############################################################################################
MesBasico[7]=497159400; EstudiosDisenosMesBasico[7]=187200000;
// '##############################################################################################
MesBasico[8]=502470100; MesBasico[9]=374425500; MesBasico[10]=909623500;
MesBasico[11]=1868798400; MesBasico[12]=1481819500; MesBasico[13]=2494004000;
MesBasico[14]=2090069705; MesBasico[15]=2402512960; MesBasico[16]=2316867952;
MesBasico[17]=2425934836; MesBasico[18]=5258273530;
// '##############################################################################################
// '##<<--------en el mes 18 hubo pago de Protocolos de bioseguridad-->>###################
// '##############################################################################################
BioseguridadMesTotal[18]=6475377;
// '###########################################################################################################################
// '########<<------------PORCENTAJES DE AMORTIZACIÓN DE LAS ACTAS MENSUALES-------------->>####################
// '##############################################################################################
Amortizacion[1]=0.5; Amortizacion[2]=0.5; Amortizacion[4]=0.85;
Amortizacion[5]=0.85; Amortizacion[6]=0.5; Amortizacion[7]=0.85;
Amortizacion[8]=0.85; Amortizacion[9]=0.85; Amortizacion[10]=0.85;
Amortizacion[11]=0.85; Amortizacion[12]=0.85; Amortizacion[13]=0.5;
Amortizacion[14]=0.5; Amortizacion[15]=0.5; Amortizacion[16]=0.5;
Amortizacion[17]=0.8; Amortizacion[18]=0.16299;
// '###############################################################################################################################
// '########<<------------CÁLCULO DE LOS VALORES DEL PRESUPUESTO-------------->>####################
// '##############################################################################################

for(let i=1; i=18; i++){
// 'Cálculo de el valor total del acta mensual y el acumulado
    IVAMes[i]=Math.round[MesBasico[i]*0.05*0.19/1.3];
    IVAEstudiosDisenosMes[i]=Math.round[EstudiosDisenosMesBasico[i]*0.19];
    EstudiosDisenosMesTotal[i]=IVAEstudiosDisenosMes[i]+EstudiosDisenosMesBasico[i];
    MesTotal[i]=MesBasico[i]+IVAMes[i]+EstudiosDisenosMesTotal[i]+BioseguridadMesTotal[i];
    AcumuladoObra[i]=AcumuladoObra[i-1]+MesBasico[i]+IVAMes[i];
    AcumuladoObraBasico[i]=AcumuladoObraBasico[i -1]+MesBasico[i];
    AcumuladoActas[i]=AcumuladoActas[i-1]+MesTotal[i];
// '#######################################################################################################
// '##<<---En el mes 11 del contrato se hizo una adición, por lo tanto, se debe adicionar
// '<##<----al total del contrato y al registro presupuestal del 2022--->##################################
// '######################################################################################################
    if (i=11){
    TotalContrato=TotalContrato+Adicion2021;
    SaldoRP[i-1]=SaldoRP[i-1]+Adicion2021;
    }
    SaldoContrato[i]=TotalContrato-AcumuladoActas[i];
    // Presupuesto2021[i]=Vigencia2021-AcumuladoObra[i];
// '#######################################################################################################
// '##<<---En el mes 12 del contrato se hizo una adición al presupuesto correspondiente a la vigencia 2022###
// '<##<----al total del contrato y al registro presupuestal del 2022--->##################################
// '######################################################################################################
    if (i=13){SaldoRP[i-1]=SaldoRP[i-1]+Vigencia2022};
// '################################################################################
// '####<<<-----------Cálculo del anticipo--------------->>######################################
// '######################################################################################
    Anticipo[i]=Math.round(Amortizacion[i]* MesBasico[i]);
// '############################################################################################
// '##<<------En el mes 14 se debió redondear el anticipo---------------->>>####################
// '##########################################################################################
    if (i=14){Anticipo[i]=1045034853};
// '############################################################################################
// '##<<------En el mes 18 no es igual el redondeo del anticipo---------------->>>#############
// '#######<<------Se hizo para finalizar el saldo del anticipo---------------->>>#############
// '##########################################################################################
    if (i=18){Anticipo[i] = 857073505};
// '################################################################################################
// '################################################################################################
    SaldoAnticipo[i]=SaldoAnticipo[i-1]-Anticipo[i];
    TdescontandoA[i]=MesTotal[i]-Anticipo[i];
// 'Cálculo del saldo de registro presupuestal
    SaldoRP[i] = SaldoRP[i - 1] - [MesTotal[i]-Anticipo[i]]
    AcumuladoRP[i]=AcumuladoRP[i-1]+MesTotal[i]-Anticipo[i]
// '###############################################################################################################################
// '########<<------------COPIAR los calculos en la hoja de excel-------------->>####################
// '##############################################################################################
    Reinicio = i;
}