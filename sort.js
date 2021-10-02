'use strict';
const ks = {};

if(!ks.sort) ks.sort = {};

if(!ks.sort.editor) ks.sort.editor = (function(){

    function Controller(){
        let moduleModel = null;
        let uiElem = null;
        this.init = function(model, ui){
            moduleModel = model;
            uiElem = ui;
            
            uiElem.input.addEventListener('keydown', this.addRow);
            uiElem.tbody.addEventListener('click', this.deleteRow);
            uiElem.sortBtnsWrap.addEventListener('click', this.btnHandler)
        }

        this.addRow = function(ev){
            moduleModel.addRow(ev);
        }

        this.deleteRow = function(ev){
            let target = ev.target;

            if(target.tagName !== 'SPAN' || target.className !== 'del-btn') return;
            ev.preventDefault();

            let prt = target.closest('[data-ks-sort]').querySelector('[data-ks-sort-idx]');

            moduleModel.deleteRow({idx:prt.dataset.ksSortIdx, text:prt.nextElementSibling.innerText});
        }

        this.btnHandler = function(ev){
            moduleModel.btnHandler(ev);
        }
    }

    function Model(){
        let moduleView = null;
        let rows = null;

        this.init = function(view){
            moduleView = view;
            this.getRowsFromLocalStorage();
            this.updateTable();
        }

        this.getRowsFromLocalStorage = function(){
            rows = localStorage.rows?JSON.parse(localStorage.rows):[];
        }

        this.setRowsToLocalStorage = function(){
            localStorage.rows = JSON.stringify(rows);
        }

        this.updateTable = function(){
            moduleView.updateTable(rows);
            this.setRowsToLocalStorage();
        }
        
        this.addRow = function(ev){
            // 보류 - 채택
            let rowForm = (row) => {
                let max = 0;
                rows.forEach(x=>{
                    max = x.idx>max?x.idx:max;
                });
                return {idx: max+1, row: row, regdate: new Date().getTime()}
            };
            let target = ev.target;

            if(ev.key === 'Enter'){
                rows.push(rowForm(target.value));
                moduleView.clearInput();
                this.updateTable();
            }
        }

        this.deleteRow = function(row){
            
            rows = rows.filter(r=>r.idx!=row.idx);
            this.updateTable();
        }

        this.btnHandler = function(ev){
            let target = ev.target;
            let text = target.innerText;

            text = text.charAt().toUpperCase()+text.slice(1);
            
            if(target.className.indexOf('btns-')==-1 || target.tagName !== 'BUTTON') return;

            ev.preventDefault();
            eval(`this.align${text}(rows);`);
        }

        this.alignSort = function(rows){
            for(let i in rows){
                for(let q in rows){
                    if(rows[i].idx < rows[q].idx){
                        let tmp = rows[i];
                        rows[i] = rows[q];
                        rows[q] = tmp;
                    }
                }
            }
            this.updateTable(rows);
        }

        this.alignReverse = function(rows){
            for(let i in rows){
                for(let q in rows){
                    if(rows[i].idx > rows[q].idx){
                        let tmp = rows[i];
                        rows[i] = rows[q];
                        rows[q] = tmp;
                    }
                }
            }
            moduleView.updateTable(rows);
        }
    }

    function View(){
        let uiElem = null;

        this.init = function(ui){
            uiElem = ui;
        }

        this.updateTable = function(rows){
            let reverse = false;
            let formedRows = '';
            let id = 1;
            if(rows.length>0 && rows[0].idx>rows[rows.length-1].idx){
                reverse = true;
                id = rows.length;
            }
            let rowForm = row => `
                    <tr data-ks-sort="tr">
                        <td data-ks-sort="index" data-ks-sort-idx="${row.idx}">${reverse?id--:id++}</td>
                        <td>${row.row}</td>
                        <td><span class="del-btn">&times;</span></td>
                    </tr>
            `;

            rows.forEach(row=>formedRows += rowForm(row));
            uiElem.tbody.innerHTML = formedRows;
        }

        this.clearInput = function(){
            uiElem.input.value = '';
        }
    }

    function Generator(){
        let uiElem = null;
        let attr = {};

        this.init = function(attributes){
            attr = attributes;
            uiElem = document.querySelector('[data-ks-sort="table"]');
            if(!uiElem){
                let tb = document.querySelector('table');
                let tf = confirm("Would you make current exists table to ks sort table?");
                tf?tb.dataset.ksSort = 'table':console.error("Please make a table that have ks sort data.");
                
                if(tf) {
                    uiElem = tb;
                    this.createAllParts();
                    return true;
                } else return false;
            } else {
                this.createAllParts();
                return true;
            }
        }

        this.generateTd = function(parent){
            let max = 0;
            for(let i of Object.values(attr['column'])){
                if(i!=undefined)
                    max = Math.max(max, i.length);
            }
            return attr['column'][parent]?attr['column'][parent].map(x=>`<td${attr['column'][parent].length==1 && max!=0?' colspan="'+max+'"':''}>${x}</td>`):`<td colspan="${max}">No Value</td>`;
        }

        this.createSortBtnsPart = function(){
            let sortBtnsWrap = document.createElement('div');
            let sort = document.createElement('button');
            let reverse = document.createElement('button');
            let clear = document.createElement('button');
            let hide = document.createElement('button');

            Object.assign(sortBtnsWrap,{
                className: "btns-wrap",
                type: "button",
            });
            Object.assign(sort,{
                className: "btns-sort",
                innerText: 'sort',
                type: "button",
            });
            Object.assign(reverse,{
                className: "btns-reverse",
                innerText: 'reverse',
                type: "button",
            });
            Object.assign(clear,{
                className: "btns-clear",
                innerText: 'clear',
                type: "button",
            });
            Object.assign(hide,{
                className: "btns-hide",
                innerText: 'hide',
                type: "button",
            });

            sortBtnsWrap.append(sort, reverse, clear, hide);

            return sortBtnsWrap;
        }

        this.createSeachPart = function(){
            let search = document.createElement('input');
            let searchBtn = document.createElement('button');
            

            Object.assign(search,{
                className: "search-bar",
                type: "text",
            });
            Object.assign(searchBtn,{
                className: "search-btn",
                innerText: "search",
                type: "button",
            });
            return [search, searchBtn];
        }

        this.createAllParts = function(){
            let dom = new DOMParser();
            let div = uiElem.insertAdjacentElement('beforeBegin', document.createElement('div'));
            let searchWrap = div.cloneNode();
            
            let elements = dom.parseFromString(`
            <table>
                <thead data-ks-sort="head">
                    <tr data-ks-sort="tr">
                        ${this.generateTd('head')}
                    </tr>
                </thead>
                <tbody data-ks-sort="body">
                    <tr>
                        ${this.generateTd('body')}
                    </tr>
                </tbody>
                <tfoot data-ks-sort="foot">
                    <tr data-ks-sort="tr">
                        ${this.generateTd('foot')}
                    </tr>
                </tfoot>
            </table>
            `, 'text/html')
            .querySelector('table').innerHTML;

            uiElem.innerHTML = `${elements}`;

            div.dataset.ksSort = 'wrap';
            div.append(uiElem);
            div.append(new DOMParser().parseFromString(`<div>
            <input type="text" data-ks-sort="input">
            </div>`,'text/html').querySelector('div'));
            
            div.prepend(this.createSortBtnsPart());
            searchWrap.prepend(...this.createSeachPart());
            div.prepend(searchWrap);
        }
    }

    return {

        init: function(attributes){
            const attr = attributes || {
                column: {
                    head: [
                        "구분",
                        "내용",
                        "비고"
                    ],
                    foot: [
                        "made by kimson"
                    ]
                }
            };
            if(this.checkValid(attr)){
                const body = document.body;
                const wrap = document.querySelector('[data-ks-sort="wrap"]');
                const search = document.querySelector('.search');
                const searchBtn = document.querySelector('.searchBtn');
                const input = document.querySelector('[data-ks-sort="input"]');
                const tb = document.querySelector('[data-ks-sort="table"]');
                const thead = document.querySelector('[data-ks-sort="head"]');
                const tbody = document.querySelector('[data-ks-sort="body"]');
                const tfoot = document.querySelector('[data-ks-sort="foot"]');
                const sortBtnsWrap = document.querySelector('.btns-wrap');
                const sort = document.querySelector('.btns-sort');
                const reverse = document.querySelector('.btns-reverse');
                const clear = document.querySelector('.btns-clear');
                const hide = document.querySelector('.btns-hide');
                
                const ui = {
                    body,
                    wrap,
                    search,
                    searchBtn,
                    input,
                    tb,
                    thead,
                    tbody,
                    tfoot,
                    sortBtnsWrap,
                    sort,
                    reverse,
                    clear,
                    hide,
                }
    
                const view = new View();
                const model = new Model();
                const controller = new Controller();
    
                view.init(ui);
                model.init(view);
                controller.init(model, ui);
            }
        },
        checkValid: function(attributes){
            const gt = new Generator();
            return gt.init(attributes);
        }

    }
})();