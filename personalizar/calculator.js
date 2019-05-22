var semestre = 1;
// Todos estos valores son con los datos del semestre anterior a calcular
var factorActividadExt = 1;
var mallaPriori
var custom_ramos = new Set();
var ramosSemestres;
var faeSemestres
var customRamosProps = {}
function start_priorix() {
    // los ramos fuera de malla se cargan primero
    mallaPriori = "Custom-" + current_malla;
    if (localStorage[mallaPriori + "_CUSTOM"]) {
        customRamosProps = JSON.parse(localStorage[mallaPriori + "_CUSTOM"]);

        for (var sigla in customRamosProps) {
            // inicializar ramos fuera de malla
            let datosRamo = customRamosProps[sigla]
            let ramo = new SelectableRamo(datosRamo[0],datosRamo[1],datosRamo[2],datosRamo[3],[],id,datosRamo[4]);
            id++;
            all_ramos[sigla] = ramo
            custom_ramos.add(sigla)
        }
    }
    let cache = localStorage[mallaPriori + '_SEMESTRES'];
    if (cache) {
        ramosSemestres = JSON.parse(cache)
    } else {
        ramosSemestres = {}
    }
    cache = localStorage[mallaPriori + '_FAE']
    if (cache) {
        faeSemestres = JSON.parse(cache)
    } else {
        faeSemestres = {}
    }
    // En un momento cargara valores guardados anteriormente
    loadSemester();
    updateCustomTable();
    // Cargar ramos fuera de malla
    var card = d3.select('#priorix');
    if (semestre == 1) {
        d3.select('#back').attr('disabled', 'disabled');
    }
    card.select('#semestre').text(semestre);
}

// $('#calculo').popover(); 




// recalculo de valores para calculo prioridad semestre


function semestreAnterior() {
    if (semestre == 1) return;
    d3.select('#back').attr('onclick', null);
    semestre--
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
    saveSemester();
    ++semestre
    let ramos = []
    SELECTED.forEach(ramo => {
    ramos.push(ramo);
    });
    var delay = 300
    ramos.forEach(ramo => {
        ramo.selectRamo();
        ramo.approveRamo()
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
    let id = mallaPriori + '_SEMESTRES';
    // Guardar ramos
    var ramosDelSemestre = []
    SELECTED.forEach(ramo => {
        ramosDelSemestre.push(ramo.sigla);
    });
    ramosSemestres[semestre] = ramosDelSemestre
    localStorage.setItem(id, JSON.stringify(ramosSemestres));

}

function loadSemester() {
    var toLoad = ramosSemestres[semestre]
    if (toLoad) {
        toLoad.forEach(sigla => {
            let ramo = all_ramos[sigla]
            if (ramo.isApproved())
                ramo.approveRamo()
            ramo.selectRamo()
        });
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
}

function limpiarCalculadora() {
    limpiarSemestre();
    let ramos = [];
    APPROVED.forEach(ramo => {
        ramos.push(ramo);
    });
    ramos.forEach(ramo => {
        ramo.approveRamo();
    });
    ramosSemestres = {}
    faeSemestres = {}

    
    localStorage[mallaPriori + '_SEMESTRES'] = JSON.stringify({})
    localStorage[mallaPriori + '_FAE'] = JSON.stringify({})
    document.getElementById('fae').value = 1;
    semestre = 1
    d3.select('#back').attr('disabled', 'disabled');
    d3.select('#semestre').text(semestre);
    let customSiglas = Array.from(custom_ramos.values());
    customSiglas.forEach(sigla => {
        borrarRamo(sigla);
    });

}
// Ramos custom
function crearRamo() {
    let nombre, sigla, creditos;

    nombre = document.getElementById('custom-name').value;
    sigla = document.getElementById('custom-sigla').value;
    creditos = document.getElementById('custom-credits').value;

    let sector = {"CUSTOM": ["#000000", "Fuera de la malla oficial"]}
    let customRamo = [nombre,sigla, creditos, 'CUSTOM' ,sector]
    let ramo = new SelectableRamo(nombre, sigla, Number(creditos), 'CUSTOM', [], id, sector)
    id++
    all_ramos[sigla] = ramo;
    customRamosProps[sigla] = customRamo;
    custom_ramos.add(sigla);
    localStorage[mallaPriori+'_CUSTOM'] = JSON.stringify(customRamosProps)
    ramo.selectRamo();
    $('#crearRamoModal').modal('hide')
}

function borrarRamo(sigla) {
    SELECTED.forEach(ramo => {
        if (ramo.sigla == sigla)
            ramo.selectRamo();
    });
    let ramo = all_ramos[sigla]
    delete all_ramos[ramo.sigla];
    custom_ramos.delete(ramo.sigla)
    delete customRamosProps[ramo.sigla];
    d3.select('#CUSTOM-' + ramo.sigla).remove();
    localStorage[mallaPriori+'_CUSTOM'] = JSON.stringify(customRamosProps)
    saveSemester();
}

function updateCustomTable(){
    let table = d3.select('#customTableContent');
	custom_ramos.forEach(ramo => {
        let selected = false;
        let semesterSelected;
        ramo = all_ramos[ramo];
        let fila = d3.select('#CUSTOM-' + ramo.sigla)
        
        SELECTED.forEach(selectedRamo => {
            if (selectedRamo == ramo)
            selected = true;
        });
        for (var s in ramosSemestres) {
            if (ramosSemestres[s].indexOf(ramo.sigla) != -1 && Number(s) != semestre) {
                semesterSelected = s
                break;
            }
        }
        
        if (!fila._groups[0][0]) {
            let acciones;
            fila = table.append('tr');

            fila.attr('id','CUSTOM-'+ ramo.sigla);
            fila.append('th')
              .attr('scope','row')
              .text(ramo.sigla);
            fila.append('td')
              .text(ramo.nombre)
            fila.append('td')
              .text(ramo.creditos);
            if (semesterSelected) {
                if (semestre == semesterSelected) {
                    fila.append('td').attr('id','state-' + ramo.sigla).text('Seleccionado')
                } else {
                    fila.append('td').attr('id','state-' + ramo.sigla).text('Seleccionado S'+ semesterSelected)
                }
            } else if (selected) {
                fila.append('td').attr('id','state-' + ramo.sigla).text('Seleccionado')
            } else {
                fila.append('td').attr('id','state-' + ramo.sigla).text('No Seleccionado')
            }
            acciones = fila.append('td').append('div')
            acciones.attr('class', 'btn-group').attr('role','group')
            if (selected) {
                acciones.append('button')
                  .attr('id','add-'+ ramo.sigla)
                  .attr('class','btn btn-secondary')
                  .attr('type','button')
                  .attr('onclick','all_ramos[\"'+ ramo.sigla+'\"].selectRamo()')
                  .text('De-Seleccionar Ramo');
                acciones.append('button')
                  .attr('id','delete-'+ ramo.sigla)
                  .attr('class','btn btn-danger')
                  .attr('type','button')
                  .attr('onclick','borrarRamo("'+ ramo.sigla + '")')
                  .text('Eliminar Ramo');

            } else {
                acciones.append('button')
                  .attr('id','add-'+ ramo.sigla)
                  .attr('class','btn btn-secondary')
                  .attr('type','button')
                  .attr('onclick','all_ramos["'+ ramo.sigla+'"].selectRamo()')
                  .text('Seleccionar Ramo');
                if (semesterSelected) {
                acciones.append('button')
                  .attr('id','delete-'+ ramo.sigla)
                  .attr('class','btn btn-danger')
                  .attr('type','button')
                  .attr('onclick','borrarRamo("'+ ramo.sigla + '")')
                  .attr('disabled','disabled')
                  .text('Eliminar Ramo');
                } else {
                    acciones.append('button')
                      .attr('id','delete-'+ ramo.sigla)
                      .attr('class','btn btn-danger')
                      .attr('type','button')
                      .attr('onclick','borrarRamo("'+ ramo.sigla + '")')
                      .text('Eliminar Ramo');
                }

            }
        } else {
            let state = d3.select('#state-' + ramo.sigla)
            let addButton = d3.select('#add-' + ramo.sigla);
            let deleteButton = d3.select('#delete-' + ramo.sigla);
            if (semesterSelected) {
                if (semestre == semesterSelected) {
                    state.text('Seleccionado')
                    addButton.attr('disabled', null).text('De-Seleccionar Ramo');
                    deleteButton.attr('disabled',null);
                } else {
                    state.text('Seleccionado S'+ semesterSelected)
                    addButton.attr('disabled', 'disabled').text('Seleccionar Ramo');
                    deleteButton.attr('disabled', 'disabled');
                }
            } else if (selected) {
                state.text('Seleccionado')
                addButton.attr('disabled', null).text('De-Seleccionar Ramo');
                deleteButton.attr('disabled',null);
            } else {
                state.text('No Seleccionado')
                addButton.attr('disabled', null).text('Seleccionar Ramo');
                deleteButton.attr('disabled', null);
            }
        }
    });
}

d3.interval(function() {
    updateCustomTable();
    }, 200);
