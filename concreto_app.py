#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os
import time
from datetime import datetime

VOLUMEN_LATA_M3 = 0.01892705
DENSIDAD_CEMENTO_KG_M3 = 1440
PESO_BULTO_KG = 50

# --- Clases y Funciones de Utilidad ---

class Colores:
    """Clase para definir colores de texto en la terminal usando códigos ANSI."""
    RESET = '\033[0m'
    ROJO = '\033[31m'
    VERDE = '\033[32m'
    AMARILLO = '\033[33m'
    AZUL = '\033[34m'
    MAGENTA = '\033[35m'
    CIAN = '\033[36m'
    BLANCO = '\033[37m'

def limpiar_pantalla():
    """Limpia la pantalla de la terminal."""
    os.system('cls' if os.name == 'nt' else 'clear')

def obtener_input_float(mensaje):
    """Solicita un número flotante al usuario de forma segura."""
    while True:
        try:
            valor = float(input(mensaje).replace(',', '.'))
            if valor >= 0: # Permitir 0 para algunos casos
                return valor
            else:
                print(f"{Colores.ROJO}Por favor, ingrese un número positivo.{Colores.RESET}")
        except ValueError:
            print(f"{Colores.ROJO}Entrada no válida. Por favor, ingrese un número.{Colores.RESET}")

def imprimir_titulo(texto):
    """Imprime un título estilizado."""
    print(f"\n{Colores.MAGENTA}{'=' * 60}{Colores.RESET}")
    print(f"{Colores.CIAN}{texto.center(60)}{Colores.RESET}")
    print(f"{Colores.MAGENTA}{'=' * 60}{Colores.RESET}")

def convertir_m3_a_latas(volumen_m3):
    """Convierte un volumen en m³ a latas."""
    return volumen_m3 / VOLUMEN_LATA_M3

def convertir_kg_cemento_a_latas(cemento_kg):
    """Convierte kg de cemento a latas usando la densidad del cemento."""
    return (cemento_kg / DENSIDAD_CEMENTO_KG_M3) / VOLUMEN_LATA_M3

def guardar_resultados_opcional(titulo_calculo, resultados_str):
    """Pregunta al usuario si desea guardar los resultados en un archivo."""
    while True:
        respuesta = input(f"\n{Colores.CIAN}¿Desea guardar estos resultados en 'resultados_calculos.txt'? (s/n): {Colores.RESET}").lower()
        if respuesta in ['s', 'si', 'sí']:
            try:
                now = datetime.now()
                fecha_hora = now.strftime("%Y-%m-%d %H:%M:%S")
                
                # Eliminar códigos de color ANSI para el archivo de texto
                import re
                resultados_limpios = re.sub(r'\033\[[0-9;]*m', '', resultados_str)

                bloque_a_guardar = f"""
============================================================
Fecha: {fecha_hora}
Cálculo: {titulo_calculo}
============================================================
{resultados_limpios}
"""
                with open("resultados_calculos.txt", "a", encoding="utf-8") as f:
                    f.write(bloque_a_guardar)
                print(f"{Colores.VERDE}Resultados guardados con éxito.{Colores.RESET}")
            except Exception as e:
                print(f"{Colores.ROJO}Error al guardar el archivo: {e}{Colores.RESET}")
            break
        elif respuesta in ['n', 'no']:
            break
        else:
            print(f"{Colores.ROJO}Respuesta no válida. Por favor, ingrese 's' o 'n'.{Colores.RESET}")

# --- Funciones de Cálculo de Mezclas ---

def obtener_volumen_deseado():
    """Permite al usuario ingresar el volumen total directamente o por dimensiones."""
    print(f"{Colores.CIAN}¿Cómo desea especificar el volumen?{Colores.RESET}")
    print(f"  {Colores.AMARILLO}1.{Colores.BLANCO} Ingresar volumen total directamente (en m³)")
    print(f"  {Colores.AMARILLO}2.{Colores.BLANCO} Calcular a partir de dimensiones (ancho, largo, espesor)")

    while True:
        opcion = input(f"\n{Colores.CIAN}Seleccione una opción para el volumen: {Colores.RESET}")
        if opcion == '1':
            return obtener_input_float(f"{Colores.CIAN}Ingrese el volumen total que necesita (en m³): {Colores.RESET}")
        elif opcion == '2':
            print(f"{Colores.AMARILLO}Ingrese las dimensiones en metros:{Colores.RESET}")
            ancho = obtener_input_float(f"  - Ancho (m): ")
            largo = obtener_input_float(f"  - Largo (m): ")
            espesor = obtener_input_float(f"  - Espesor/Altura (m): ")
            volumen_calculado = ancho * largo * espesor
            print(f"{Colores.VERDE}Volumen calculado: {volumen_calculado:.4f} m³{Colores.RESET}")
            return volumen_calculado
        else:
            print(f"{Colores.ROJO}Opción no válida. Por favor, elija 1 o 2.{Colores.RESET}")

def calcular_mortero():
    imprimir_titulo("Cálculo de Mezcla de Mortero")
    FACTOR_CONTRACCION = 1.52
    volumen_final = obtener_volumen_deseado()
    
    while True:
        try:
            proporcion_str = input(f"\n{Colores.CIAN}Ingrese la proporción Cemento:Arena (ej: 1:4): {Colores.RESET}")
            partes = [float(p) for p in proporcion_str.split(':')]
            if len(partes) == 2 and partes[0] > 0:
                p_cemento, p_arena = partes
                break
            else:
                print(f"{Colores.ROJO}Formato incorrecto. Debe ser 'cemento:arena'.{Colores.RESET}")
        except (ValueError, IndexError):
            print(f"{Colores.ROJO}Formato de proporción no válido.{Colores.RESET}")

    suma_proporciones = p_cemento + p_arena
    volumen_seco_total = volumen_final * FACTOR_CONTRACCION
    vol_cemento = (p_cemento / suma_proporciones) * volumen_seco_total
    vol_arena = (p_arena / suma_proporciones) * volumen_seco_total
    
    cemento_kg = vol_cemento * DENSIDAD_CEMENTO_KG_M3
    cemento_latas = convertir_kg_cemento_a_latas(cemento_kg)
    arena_latas = convertir_m3_a_latas(vol_arena)

    titulo_calculo = f"Cálculo para {volumen_final:.3f} m³ de Mortero ({proporcion_str})"

    resultados_str = (
        f"{'Material':<25} | {'Cantidad principal':<20} | {'Cantidad secundaria':<20}\n"
        f"{'-'*25} | {'-'*20} | {'-'*20}\n"
        f"{Colores.BLANCO}{'Cemento':<25} | {Colores.VERDE}{cemento_kg:<20.2f} kg{Colores.RESET} | "
        f"{Colores.AMARILLO}{cemento_latas:<20.2f} latas{Colores.RESET}\n"
        f"{Colores.BLANCO}{'Arena':<25} | {Colores.VERDE}{vol_arena:<20.4f} m³{Colores.RESET} | "
        f"{Colores.AMARILLO}{arena_latas:<20.2f} latas{Colores.RESET}"
    )

    print(f"\n{Colores.VERDE}--- {titulo_calculo} ---{Colores.RESET}")
    print(resultados_str)
    guardar_resultados_opcional(titulo_calculo, resultados_str)
    input(f"\n{Colores.AMARILLO}Presione Enter para volver al menú...{Colores.RESET}")

def calcular_concreto_volumen():
    imprimir_titulo("Cálculo de Mezcla de Concreto (Método Volumen)")
    FACTOR_CONTRACCION = 1.57
    volumen_final = obtener_volumen_deseado()
    
    while True:
        try:
            proporcion_str = input(f"\n{Colores.CIAN}Ingrese la proporción C:A:G (ej: 1:2:3): {Colores.RESET}")
            partes = [float(p) for p in proporcion_str.split(':')]
            if len(partes) == 3 and partes[0] > 0:
                p_cemento, p_arena, p_grava = partes
                break
            else:
                 print(f"{Colores.ROJO}Formato incorrecto. Debe ser 'cemento:arena:grava'.{Colores.RESET}")
        except (ValueError, IndexError):
            print(f"{Colores.ROJO}Formato de proporción no válido.{Colores.RESET}")

    suma_proporciones = p_cemento + p_arena + p_grava
    volumen_seco_total = volumen_final * FACTOR_CONTRACCION
    vol_cemento = (p_cemento / suma_proporciones) * volumen_seco_total
    vol_arena = (p_arena / suma_proporciones) * volumen_seco_total
    vol_grava = (p_grava / suma_proporciones) * volumen_seco_total

    cemento_kg = vol_cemento * DENSIDAD_CEMENTO_KG_M3
    cemento_latas = convertir_kg_cemento_a_latas(cemento_kg)
    arena_latas = convertir_m3_a_latas(vol_arena)
    grava_latas = convertir_m3_a_latas(vol_grava)

    titulo_calculo = f"Cálculo para {volumen_final:.3f} m³ de Concreto ({proporcion_str})"

    resultados_str = (
        f"{'Material':<25} | {'Cantidad principal':<20} | {'Cantidad secundaria':<20}\n"
        f"{'-'*25} | {'-'*20} | {'-'*20}\n"
        f"{Colores.BLANCO}{'Cemento':<25} | {Colores.VERDE}{cemento_kg:<20.2f} kg{Colores.RESET} | "
        f"{Colores.AMARILLO}{cemento_latas:<20.2f} latas{Colores.RESET}\n"
        f"{Colores.BLANCO}{'Arena':<25} | {Colores.VERDE}{vol_arena:<20.4f} m³{Colores.RESET} | "
        f"{Colores.AMARILLO}{arena_latas:<20.2f} latas{Colores.RESET}\n"
        f"{Colores.BLANCO}{'Grava/Triturado':<25} | {Colores.VERDE}{vol_grava:<20.4f} m³{Colores.RESET} | "
        f"{Colores.AMARILLO}{grava_latas:<20.2f} latas{Colores.RESET}"
    )
    
    print(f"\n{Colores.VERDE}--- {titulo_calculo} ---{Colores.RESET}")
    print(resultados_str)
    guardar_resultados_opcional(titulo_calculo, resultados_str)
    input(f"\n{Colores.AMARILLO}Presione Enter para volver al menú...{Colores.RESET}")

def calcular_concreto_tarreo():
    imprimir_titulo("Cálculo de Concreto para Vías (Método Tarreo)")
    
    print(f"{Colores.VERDE}Volumen a vaciar:{Colores.RESET}")
    largo = obtener_input_float("Ingrese el largo de la vía[m]= ")
    ancho = obtener_input_float("Ingrese el ancho de la vía[m]= ")
    espesor = obtener_input_float("Ingrese el espesor de la vía[m]= ")
    volumen = largo * ancho * espesor
    print(f"El volumen a vaciar es de: {Colores.VERDE}{volumen:.3f} m³{Colores.RESET}")

    print(f"\n{Colores.VERDE}Proporciones de material:{Colores.RESET}")
    arena = obtener_input_float("Ingrese la proporción de arena= ")
    agregado = obtener_input_float("Ingrese la proporción de agregado grueso= ")

    volumenm3 = (0.45 + 1/3.15 + arena/2.6 + agregado/2.6) / 20
    bolsascemento = 1.05 * 0.98 * volumen / volumenm3
    viajesarena = (50 * arena * bolsascemento / 1700)
    viajesagregado = (50 * agregado * bolsascemento) / 1650
    agua = 0.5 * bolsascemento * 35
    cemento_kg = bolsascemento * PESO_BULTO_KG
    cemento_latas = convertir_kg_cemento_a_latas(cemento_kg)
    arena_latas = convertir_m3_a_latas(viajesarena)
    agregado_latas = convertir_m3_a_latas(viajesagregado)

    titulo_calculo = f"Cálculo para Vía de {volumen:.3f} m³ (Proporción 1:{arena}:{agregado})"
    resultados_str = (
        f"Cemento: {cemento_kg:.2f} kg ({cemento_latas:.2f} latas, equivalente a {bolsascemento:.2f} bolsas de 50 kg)\n"
        f"Arena: {viajesarena:.3f} m³ ({arena_latas:.2f} latas, equivalente a {viajesarena/6:.2f} viajes de 6m³)\n"
        f"Triturado: {viajesagregado:.3f} m³ ({agregado_latas:.2f} latas, equivalente a {viajesagregado/6:.2f} viajes de 6m³)\n"
        f"Cantidad de agua: {agua:.2f} litros"
    )

    print(f"\n{Colores.VERDE}--- {titulo_calculo} ---{Colores.RESET}")
    print(resultados_str)
    guardar_resultados_opcional(titulo_calculo, resultados_str)
    input(f"\n{Colores.AMARILLO}Presione Enter para volver al menú...{Colores.RESET}")

# --- Funciones de Cálculo de Acero ---

def calcular_acero_placa_huella():
    imprimir_titulo("Cálculo de Acero para Placa Huella")
    largo = obtener_input_float("Ingrese el largo de la vía [m]: ")
    
    refuerzoLongitudinal = ((largo-6)/5.4+1)*10
    refuerzoTransversal = (largo/3)*18*0.9
    riostras = (largo/3)*(26+4.1*4)
    cunetasLongitudinal = ((largo-6)/5.4+1)*8
    cunetasTransversal = (largo/3)*18*0.9
    TOTAL = refuerzoLongitudinal + refuerzoTransversal/6 + riostras/6 + cunetasLongitudinal + cunetasTransversal/6
    
    titulo_calculo = f"Cálculo de Acero para Placa Huella de {largo} m"
    resultados_str = (
        f"--- Acero de los Rieles ---\n"
        f"  Metros de acero longitudinal: {refuerzoLongitudinal*6:.2f} m\n"
        f"  Varillas de acero longitudinal: {refuerzoLongitudinal:.2f} varillas\n"
        f"  Metros de acero transversal: {refuerzoTransversal:.2f} m\n"
        f"  Varillas de acero transversal: {refuerzoTransversal/6:.2f} varillas\n\n"
        f"--- Acero de las Riostras ---\n"
        f"  Metros de acero para riostras: {riostras:.2f} m\n"
        f"  Varillas de acero para riostras: {riostras/6:.2f} varillas\n\n"
        f"--- Acero de las Cunetas ---\n"
        f"  Metros de acero longitudinal: {cunetasLongitudinal*6:.2f} m\n"
        f"  Varillas de acero longitudinal: {cunetasLongitudinal:.2f} varillas\n"
        f"  Metros de acero transversal: {cunetasTransversal:.2f} m\n"
        f"  Varillas de acero transversal: {cunetasTransversal/6:.2f} varillas\n\n"
        f"--- TOTAL DE VARILLAS ---\n"
        f"  Se necesitan un total de {TOTAL:.2f} varillas de acero."
    )
    
    print(f"\n{Colores.VERDE}{titulo_calculo}{Colores.RESET}")
    print(resultados_str)
    guardar_resultados_opcional(titulo_calculo, resultados_str)
    input(f"\n{Colores.AMARILLO}Presione Enter para volver al menú...{Colores.RESET}")

def calcular_acero_pavimento_rigido():
    imprimir_titulo("Cálculo de Acero para Pavimento Rígido")
    largo_placa = obtener_input_float("Ingrese el largo de la placa[m]: ")
    ancho_placa = obtener_input_float("Ingrese el ancho de la placa [m]: ")
    esbeltez = largo_placa / ancho_placa
    print(f"El factor de esbeltez es de: {esbeltez:.2f}")

    diseno = input(f"{Colores.VERDE}El diseño es de Argelia? (1. Si / 2. No): {Colores.RESET}")
    if diseno == "1":
        espDovela, longDovela, longAnclajes = 30, 40, 85
    else:
        espDovela = obtener_input_float(f"{Colores.VERDE}Espaciamiento de dovelas[cm]: {Colores.RESET}")
        longDovela = obtener_input_float("Longitud de dovelas[cm]: ")
        longAnclajes = obtener_input_float("Longitud de varillas de anclaje[cm]: ")
    
    longTotal = obtener_input_float("Ingrese la longitud total del tramo[m]: ")
    
    numeroDovelas = int((ancho_placa * 100 / espDovela) * (longTotal / largo_placa))
    varillasDovelas = int(numeroDovelas * longDovela / 600)
    
    numeroAnclajes = int(longTotal / largo_placa) * 2
    varillasAnclajes = int(numeroAnclajes * longAnclajes / 600)

    titulo_calculo = f"Acero para Pavimento Rígido de {longTotal} m"
    resultados_str = (
        f"Número de dovelas: {numeroDovelas} trozos de {longDovela} cm\n"
        f"Se necesitan: {varillasDovelas} varillas de 1\"\n\n"
        f"Número de anclajes: {numeroAnclajes} barras de {longAnclajes} cm\n"
        f"Se necesitan: {varillasAnclajes} varillas de 1/2\""
    )

    print(f"\n{Colores.VERDE}--- {titulo_calculo} ---{Colores.RESET}")
    print(resultados_str)
    guardar_resultados_opcional(titulo_calculo, resultados_str)
    input(f"\n{Colores.AMARILLO}Presione Enter para volver al menú...{Colores.RESET}")

def consultar_info_barras():
    imprimir_titulo("Consulta de Propiedades de Varillas de Acero")
    info = {
        "Diametro [in]": [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1, 1.128, 1.27, 1.41, 1.5],
        "Diametro [mm]": [7.9, 9.5, 12.7, 15.9, 19.1, 22.2, 25.4, 28.7, 32.3, 35.8, 38.1],
        "Masa [kg/m]": [0.384, 0.56, 0.994, 1.552, 2.235, 3.042, 3.973, 5.06, 6.404, 7.907, 8.938],
        "Area [mm2]": [49, 71, 129, 199, 284, 387, 510, 645, 819, 1006, 1140]
    }
    
    numeroVarilla = int(obtener_input_float(f"\n{Colores.CIAN}Ingrese el # de la varilla (2-11): {Colores.RESET}"))
    if not 2 <= numeroVarilla <= 11:
        print(f"{Colores.ROJO}Número de varilla no válido.{Colores.RESET}")
        return

    idx = numeroVarilla - 2
    titulo_calculo = f"Propiedades de la varilla #{numeroVarilla}"
    
    resultados_str = ""
    for key, values in info.items():
        resultados_str += f"  - {key:<20}: {values[idx]}\n"

    print(f"\n{Colores.VERDE}{titulo_calculo}:{Colores.RESET}")
    print(resultados_str)
    guardar_resultados_opcional(titulo_calculo, resultados_str)
    input(f"\n{Colores.AMARILLO}Presione Enter para volver al menú...{Colores.RESET}")

def menu_acero():
    while True:
        limpiar_pantalla()
        imprimir_titulo("Submenú de Cálculo de Acero")
        print(f"\n{Colores.CIAN}Seleccione una opción:{Colores.RESET}")
        print(f"  {Colores.AMARILLO}1.{Colores.BLANCO} Acero para Placa Huella")
        print(f"  {Colores.AMARILLO}2.{Colores.BLANCO} Acero para Pavimento Rígido")
        print(f"  {Colores.AMARILLO}3.{Colores.BLANCO} Consultar Propiedades de Varillas")
        print(f"  {Colores.AMARILLO}4.{Colores.BLANCO} Volver al menú principal")
        
        opcion = input(f"\n{Colores.CIAN}Opción: {Colores.RESET}")
        if opcion == '1': calcular_acero_placa_huella()
        elif opcion == '2': calcular_acero_pavimento_rigido()
        elif opcion == '3': consultar_info_barras()
        elif opcion == '4': break
        else: print(f"{Colores.ROJO}Opción no válida.{Colores.RESET}"); time.sleep(1)

# --- Información y Bucle Principal ---

def mostrar_informacion_importante():
    imprimir_titulo("Información Importante y Tablas de Referencia")
    print(f"{Colores.AZUL}Factor de Contracción (Esponjamiento):{Colores.RESET}")
    print(f"  - Se necesita más material seco para un volumen húmedo final.")
    print(f"  - Usado por este script: {Colores.AMARILLO}1.52 (mortero){Colores.RESET} y {Colores.AMARILLO}1.57 (concreto){Colores.RESET}.")
    print(f"\n{Colores.AZUL}Densidad del Cemento (para bultos):{Colores.RESET}")
    print(f"  - Usado por este script: {Colores.AMARILLO}1440 kg/m³{Colores.RESET}.")
    print(f"\n{Colores.AZUL}Medida 'Lata':{Colores.RESET}")
    print(f"  - 1 Lata = 5 galones (US) = 18.93 litros = {Colores.AMARILLO}0.0189 m³{Colores.RESET}")
    print(f"\n{Colores.AZUL}Tablas de Resistencia (Referencia):{Colores.RESET}")
    print(f"{ 'Dosificación':<25} {'Resistencia':<25} {'Uso Común'}")
    print(f"{Colores.AMARILLO}--- CONCRETO (C:A:G) ---{Colores.RESET}")
    print(f"{ '1:2:2':<25} {'~280 kg/cm²':<25} {'Columnas, vigas, alta resistencia'}")
    print(f"{ '1:2:3':<25} {'~210 kg/cm²':<25} {'Estructuras generales, losas'}")
    print(f"{ '1:3:5':<25} {'~140 kg/cm²':<25} {'Concreto simple, rellenos'}")
    print(f"{Colores.AMARILLO}--- MORTERO (C:A) ---{Colores.RESET}")
    print(f"{ '1:3':<25} {'~125 kg/cm²':<25} {'Revoques impermeables'}")
    print(f"{ '1:4':<25} {'~90 kg/cm²':<25}  {'Revoques comunes'}")
    input(f"\n{Colores.AMARILLO}Presione Enter para volver...{Colores.RESET}")

def main():
    while True:
        limpiar_pantalla()
        imprimir_titulo("Calculadora Unificada de Construcción")
        print(f"\n{Colores.CIAN}Seleccione una opción:{Colores.RESET}")
        print(f"{Colores.MAGENTA}--- CÁLCULOS DE MEZCLAS ---{Colores.RESET}")
        print(f"  {Colores.AMARILLO}1.{Colores.BLANCO} Concreto (Método Volumen)")
        print(f"  {Colores.AMARILLO}2.{Colores.BLANCO} Mortero")
        print(f"  {Colores.AMARILLO}3.{Colores.BLANCO} Concreto para Vías (Método Tarreo)")
        print(f"{Colores.MAGENTA}--- CÁLCULOS DE ACERO ---{Colores.RESET}")
        print(f"  {Colores.AMARILLO}4.{Colores.BLANCO} Submenú de Acero")
        print(f"{Colores.MAGENTA}--- INFORMACIÓN ---{Colores.RESET}")
        print(f"  {Colores.AMARILLO}5.{Colores.BLANCO} Valores de referencia")
        print(f"  {Colores.AMARILLO}6.{Colores.BLANCO} Salir")

        opcion = input(f"\n{Colores.CIAN}Opción: {Colores.RESET}")

        if opcion == '1': calcular_concreto_volumen()
        elif opcion == '2': calcular_mortero()
        elif opcion == '3': calcular_concreto_tarreo()
        elif opcion == '4': menu_acero()
        elif opcion == '5': mostrar_informacion_importante()
        elif opcion == '6': print(f"{Colores.VERDE}¡Hasta luego!{Colores.RESET}"); sys.exit(0)
        else: print(f"{Colores.ROJO}Opción no válida.{Colores.RESET}"); time.sleep(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{Colores.ROJO}Programa interrumpido. Saliendo...{Colores.RESET}")
        sys.exit(0)
