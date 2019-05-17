var semestre = 1;
// Todos estos valores son con los datos del semestre anterior a calcular
var creditosTotales = 0;
var creditosAprovados = 0;
var sumaNotasCreditos = 0
var factorActividadExt = 1;
var ramosSemestre = [];
var mallaPriori

function start_priorix() {
    mallaPriori = "prioridad-" + current_malla;
    loadSemester();
    
    // En un momento cargara valores guardados anteriormente
    var card = d3.select('#priorix');
    if (semestre == 1) {
        d3.select('#back').attr('disabled', 'disabled');
    }
    card.select('#semestre').text(semestre);
}

// $('#calculo').popover(); 

function calcularPrioridad() {
    // Calculo prioridad
    factorActividadExt = document.getElementById('fae').value;
    var creditosTotalesSemestre = creditosTotales;
    var creditosAprovadosSemestre = creditosAprovados;
    var sumaNotasCreditosSemestre = sumaNotasCreditos;
    SELECTED.forEach(ramo => {
        let nota = Number(document.getElementById('nota-' + ramo.sigla).value)
        sumaNotasCreditosSemestre += nota * ramo.creditos;
        creditosTotalesSemestre += ramo.creditos;
        if (nota > 54) {
            creditosAprovadosSemestre += ramo.creditos;
        }
    });
    saveSemester();
    let prioridad = 100 * (sumaNotasCreditosSemestre/(14 * Math.pow(semestre,1.06))) * (creditosAprovadosSemestre/creditosTotalesSemestre) * factorActividadExt
    // Mostrar resultado
    d3.select('#calculo').attr('data-content', prioridad)
    $('#calculo').popover('show')
    console.log(creditosAprovadosSemestre, creditosTotalesSemestre, sumaNotasCreditosSemestre);
    // var t = d3.timer(function(elapsed) {
    //     $('#calculo').popover('toggle')
    //     if (elapsed > 200) t.stop();
    //   }, 2000);
    // La prioridad se guarda por si acaso
    var t = d3.timeout(function(elapsed) {
        $('#calculo').popover('hide');       
        $('#calculo').popover('dispose');       
      }, 1500);
    return [creditosTotalesSemestre, creditosAprovadosSemestre, sumaNotasCreditosSemestre, prioridad];
}

// recalculo de valores para calculo prioridad semestre
function valoresSemestresAnteriores() {
    sumaNotasCreditos = 0
    creditosAprovados = 0
    creditosTotales = 0
    for ( var s = 1 ; s < semestre; s++) {
        let id = mallaPriori + '_' + (s);
        let semestre = JSON.parse(localStorage[id]);
        for (var sigla in semestre) {
            ramo = all_ramos[sigla];
            sumaNotasCreditos += semestre[sigla] * ramo.creditos;
            creditosTotales += ramo.creditos;
            if (semestre[sigla] > 54)
                creditosAprovados += ramo.creditos;       
        }
    }
}

function semestreAnterior() {
    if (semestre == 1) return;
    d3.select('#back').attr('onclick', null);
    semestre--
    valoresSemestresAnteriores();
    limpiarSemestre();
    setTimeout(function(){ // Tiempo para que se limpie la calculadora
        loadSemester();
        d3.select('#semestre').text(semestre);
        if (semestre == 1)
            d3.select('#back').attr('disabled', 'disabled');    
        d3.select('#back').attr('onclick', 'semestreAnterior()');
    }, 350)
}

function proximoSemestre() {
    d3.select('#forward').attr('onclick', null);
    let valoresPrioridad = calcularPrioridad();
    creditosTotales = valoresPrioridad[0];
    creditosAprovados = valoresPrioridad[1];
    sumaNotasCreditos =valoresPrioridad[2];
    saveSemester();
    ++semestre
    let ramos = []
    SELECTED.forEach(ramo => {
    ramos.push(ramo);
    });
    var hayProximoSemestre = localStorage[mallaPriori + '_' + (semestre + 1)];
    var delay = 300
    ramos.forEach(ramo => {
        if (Number(document.getElementById('nota-' + ramo.sigla).value) > 54) {
            ramo.selectRamo();
            ramo.approveRamo();
        } else  if (hayProximoSemestre) {
            ramo.selectRamo();
            d3.select("#" + ramo.sigla).select(".selected").transition().duration(150).attr('stroke','yellow')
              .transition().duration(150).attr("opacity", ".8")
              .transition().duration(150).attr("opacity", ".5")
              .transition().duration(150).attr("opacity", ".8")
              .transition().duration(150).attr("opacity", ".001")
              .attr('stroke','green');
            delay = 760;
        } else {
            d3.select("#" + ramo.sigla).select(".selected").transition().duration(150).attr('stroke','red')
                .transition().duration(150).attr("opacity", ".5")
                .transition().duration(150).attr("opacity", ".8")
                .transition().duration(150).attr("opacity", ".5")
                .transition().duration(150).attr("opacity", ".8")
                .attr('stroke','green');
            delay = 760;
        }
    });
    d3.select('#semestre').text(semestre);
    if (semestre == 2) 
        d3.select('#back').attr('disabled', null);
        setTimeout(function(){ // Tiempo para que se limpie la calculadora
            loadSemester();
            d3.select('#forward').attr('onclick', 'proximoSemestre()');

        }, delay)
    
}

function saveSemester() {
    let id = mallaPriori + '_' + semestre;
    // Guardar notas
    var willStore = {}
    SELECTED.forEach(ramo => {
        willStore[ramo.sigla] = Number(document.getElementById('nota-' + ramo.sigla).value);
    });
    localStorage.setItem(id, JSON.stringify(willStore));
    // Guardar FAE
    id = mallaPriori + '_FAE'
    willStore = localStorage.getItem(id);
    if (willStore == null) {
        willStore = {}
    } else {
        willStore = JSON.parse(willStore);
    }
    willStore[semestre] = factorActividadExt;
    localStorage.setItem(id, JSON.stringify(willStore));
}

function loadSemester() {
    let id = mallaPriori + '_' + semestre;
    var toLoad = localStorage[id];
    var faeToLoad = localStorage[mallaPriori + '_FAE'];
    if (toLoad) {
        toLoad = JSON.parse(toLoad);
        faeToLoad = JSON.parse(faeToLoad);
        for (var sigla in toLoad) {
            var ramo = all_ramos[sigla]
            if (!ramo.isSelected()) {
                if (ramo.isApproved()) 
                    ramo.approveRamo();
                ramo.selectRamo();
                d3.select('#nota-' + sigla).attr('value', toLoad[sigla]);
            }
        }
        document.getElementById('fae').value = faeToLoad[semestre];
    }

}


function limpiarSemestre() {
    let ramos = []
    SELECTED.forEach(ramo => {
    ramos.push(ramo);
    });
    ramos.forEach(ramo => {
        ramo.selectRamo();
    });
    document.getElementById('fae').value = 1;
}

function limpiarCalculadora() {
    creditosTotales = 0
    creditosAprovados = 0
    sumaNotasCreditos = 0
    limpiarSemestre();
    let ramos = [];
    APPROVED.forEach(ramo => {
        ramos.push(ramo);
    });
    ramos.forEach(ramo => {
        ramo.approveRamo();
    });
    var s = 1
    while (localStorage[mallaPriori + '_' + s] != null) {
        localStorage.removeItem(mallaPriori + '_' + s);
        s++;
    }
    localStorage.removeItem(mallaPriori + '_FAE')
    document.getElementById('fae').value = 1;
    semestre = 1
    d3.select('#back').attr('disabled', 'disabled');
    d3.select('#semestre').text(semestre);
}