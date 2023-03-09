import { LightningElement, api, track, wire } from 'lwc';
import {appTotal, calcDryFert, calcLiqFert, unitsRequired, roundNum, perProduct, areaTreated, sumFert} from 'c/programBuilderHelper';
import {checkPricing} from 'c/helper';
import { getObjectInfo, getPicklistValues} from 'lightning/uiObjectInfoApi';
import PRODUCT_OBJ from '@salesforce/schema/App_Product__c';
import NOTE from '@salesforce/schema/App_Product__c.Note__c';
export default class AppRatePrice extends LightningElement {
           @track data; 
           @api areaSize;
           appTotalPrice;  
           loaded = true; 
           appTotalN = 0
           appTotalP = 0
           appTotalK = 0
           measure = 'M'
           goodPricing = true; 
           noteOps; 
           //for mouse over
           showProdInfo = false;
           productName = '';
           productCost = 0;
           levelOne;
           levelTwo;
           prodFloor;
           prodCostM;
           prodCostA;
           totalCostPerM = 0;
           totalCostPerAcre = 0;
           treatedAcreage = 0;
           prodN;
           prodP;
           prodK;
           //note on the application 
           oppNote = ''; 

           @api 
           get selection(){
            return this.data;
           }
           //need to make this private so we can edit this
           set selection(value){
               this.data = JSON.parse(JSON.stringify(value));     
               this.appTotalPrice = appTotal(this.data); 
           }

    //need this to get picklist
    @wire(getObjectInfo, { objectApiName: PRODUCT_OBJ })
        objectInfo;

    //get sub category picklist
    @wire(getPicklistValues, {
        recordTypeId: "$objectInfo.data.defaultRecordTypeId",
        fieldApiName: NOTE
      })
      noteOps;

//user changes the rate for the product
           newRate(e){
            let index = this.data.findIndex(prod => prod.Id === e.target.name);
            
            window.clearTimeout(this.delay);
             // eslint-disable-next-line @lwc/lwc/no-async-operation
            this.delay = setTimeout(()=>{
                this.data[index].Rate2__c = Number(e.detail.value);
                
                if(this.data[index].Unit_Area__c != '' && this.data[index].Unit_Area__c != null){
                    //console.log('uofm',this.data[index].Unit_Area__c,'rate', this.data[index].Rate2__c,'area size', this.areaSize,'product size', this.data[index].size)
                    this.data[index].Units_Required__c = unitsRequired(this.data[index].Unit_Area__c, this.data[index].Rate2__c, this.areaSize, this.data[index].Product_Size__c )    
                    this.data[index].Total_Price__c = roundNum(this.data[index].Units_Required__c * this.data[index].Unit_Price__c,2);
                    let costs = perProduct(this.data[index].Total_Price__c, this.data[index].Product_Size__c, this.data[index].Rate2__c, this.data[index].Unit_Area__c);
                    
                    this.data[index].costM = costs.perThousand;
                    this.data[index].costA = costs.perAcre; 
                    this.prodCostM = costs.perThousand;
                    this.prodCostA = costs.perAcre;
                    this.prodAreaCost = this.areaAcres * this.costPerAcre; 
                    this.treatedAcreage = areaTreated(this.data[index].Product_Size__c,this.data[index].Rate2__c, this.data[index].Unit_Area__c );
                    this.appTotalPrice = appTotal(this.data);
                    this.totalCostPerM = roundNum(this.appTotalPrice/(this.areaSize/1000),2); 
                    if(this.data[index].isFert){
                        let fert = this.data[index].Product_Type__c === 'Dry' ? calcDryFert(this.data[index].Rate2__c, this.data[index]) : calcLiqFert(this.data[index].Rate2__c, this.data[index]);
                        this.data[index].N__c = fert.n;
                        this.data[index].P__c = fert.p;
                        this.data[index].K__c = fert.k;
                        
                        let totalFert = sumFert(this.data)
                        this.appTotalN = roundNum(totalFert.N__c, 4);
                        this.appTotalP = roundNum(totalFert.P__c, 4);
                        this.appTotalK = roundNum(totalFert.K__c, 4); 
                    } 
                }
                
            },500 ) 
           }

           handleUnitArea(e){
               let index = this.data.findIndex(prod => prod.Id === e.target.name);
               //console.log('index ' +index + ' detail '+e.detail.value );
               
               this.data[index].Unit_Area__c = e.detail.value;
               
               if(this.data[index].Rate2__c > 0){
                this.data[index].Units_Required__c = unitsRequired(this.data[index].Unit_Area__c, this.data[index].Rate2__c, this.areaSize, this.data[index].Product_Size__c );
                this.data[index].Total_Price__c = roundNum(this.data[index].Units_Required__c * this.data[index].Unit_Price__c, 2);

                let costs = perProduct(this.data[index].Total_Price__c, this.data[index].Product_Size__c, this.data[index].Rate2__c, this.data[index].Unit_Area__c);

                this.data[index].costM = costs.perThousand;
                this.data[index].costA = costs.perAcre; 
                this.prodCostM = costs.perThousand;
                this.prodCostA = costs.perAcre;
                this.prodAreaCost = this.areaAcres * this.costPerAcre;
                this.treatedAcreage = areaTreated(this.data[index].Product_Size__c,this.data[index].Rate2__c, this.data[index].Unit_Area__c );
                this.appTotalPrice = appTotal(this.data); 
                this.totalCostPerM = roundNum(this.appTotalPrice/(this.areaSize/1000),2);
                //handle fertilizer
                if(this.data[index].isFert){
                    let fert = this.data[index].Product_Type__c === 'Dry' ? calcDryFert(this.data[index].Rate2__c, this.data[index]) : calcLiqFert(this.data[index].Rate2__c, this.data[index]);
                    this.data[index].N__c = fert.n;
                    this.data[index].P__c = fert.p;
                    this.data[index].K__c = fert.k;
                    
                    let totalFert = sumFert(this.data)
                    this.appTotalN = roundNum(totalFert.N__c, 4);
                    this.appTotalP = roundNum(totalFert.P__c, 4);
                    this.appTotalK = roundNum(totalFert.K__c, 4); 
                } 
               }
           }

//Pricing 
           //this is a reuable functions for pricing and line totals
           appTotal = (t, nxt)=> roundNum((t+nxt),2); 
           
           newPrice(e){
                window.clearTimeout(this.delay);
                let index = this.data.findIndex(prod => prod.Id === e.target.name);
                let targetId = e.target.name; 
                
                this.delay = setTimeout(()=>{
                    this.data[index].Unit_Price__c = e.detail.value;
                    //this.data[index].Unit_Price__c = Number(this.data[index].Unit_Price__c);
                    //console.log(typeof this.data[index].Unit_Price__c +' unit Type');          
                        
                        if(this.data[index].Unit_Price__c > 0){
                        console.log('unit price')
                        this.data[index].Margin__c = roundNum((1 - (this.data[index].Product_Cost__c /this.data[index].Unit_Price__c))*100, 2);
                        this.data[index].Total_Price__c = roundNum(this.data[index].Units_Required__c * this.data[index].Unit_Price__c, 2);
                        let costs = perProduct(this.data[index].Total_Price__c, this.data[index].Product_Size__c, this.data[index].Rate2__c, this.data[index].Unit_Area__c);

                        this.data[index].costM = costs.perThousand;
                        this.data[index].costA = costs.perAcre; 
                        this.prodCostM = costs.perThousand;
                        this.prodCostA = costs.perAcre;
                        this.prodAreaCost = this.areaAcres * this.costPerAcre; 
                    }else{
                        this.data[index].Margin__c = 0;                
                        this.data[index].Margin__c = roundNum(this.data[index].Margin__c, 2);
                        this.data[index].Total_Price__c = roundNum(this.data[index].Units_Required__c * this.data[index].Unit_Price__c, 2);
                        let costs = perProduct(this.data[index].Total_Price__c, this.data[index].Product_Size__c, this.data[index].Rate2__c, this.data[index].Unit_Area__c);

                        this.data[index].costM = costs.perThousand;
                        this.data[index].costA = costs.perAcre; 
                        this.prodCostM = costs.perThousand;
                        this.prodCostA = costs.perAcre;
                        this.prodAreaCost = this.areaAcres * this.costPerAcre;

                    }
                    this.appTotalPrice = appTotal(this.data);
                    this.totalCostPerM = roundNum(this.appTotalPrice/(this.areaSize/1000),2);
                    let lOne = Number(this.data[index].levelOne)
                    let floor = Number(this.data[index].floorPrice)
                    let unitPrice = this.data[index].Unit_Price__c
                    this.handleWarning(targetId, lOne, floor, unitPrice, index)
                    }, 1000)
           }
           newMargin(m){
                window.clearTimeout(this.delay)
                    let index = this.data.findIndex(prod => prod.Id === m.target.name)
                    // eslint-disable-next-line @lwc/lwc/no-async-operation
                    this.delay = setTimeout(()=>{
                            this.data[index].Margin__c = Number(m.detail.value);
                            if(1- this.data[index].Margin__c/100 > 0){
                                this.data[index].Unit_Price__c = roundNum(this.data[index].Product_Cost__c /(1- this.data[index].Margin__c/100), 2)
                                this.data[index].Total_Price__c = roundNum(this.data[index].Units_Required__c * this.data[index].Unit_Price__c, 2)
                                let costs = perProduct(this.data[index].Total_Price__c, this.data[index].Product_Size__c, this.data[index].Rate2__c, this.data[index].Unit_Area__c);

                                this.data[index].costM = costs.perThousand;
                                this.data[index].costA = costs.perAcre; 
                                this.prodCostM = costs.perThousand;
                                this.prodCostA = costs.perAcre;
                                this.prodAreaCost = this.areaAcres * this.costPerAcre;
                                                           
                            }else{
                                this.data[index].Unit_Price__c = 0;
                                this.data[index].Unit_Price__c = this.data[index].Unit_Price__c.toFixed(2);
                                this.data[index].Total_Price__c = roundNum(this.data[index].Units_Required__c * this.data[index].Unit_Price__c, 2);
                                let costs = perProduct(this.data[index].Total_Price__c, this.data[index].Product_Size__c, this.data[index].Rate2__c, this.data[index].Unit_Area__c);

                                this.data[index].costM = costs.perThousand;
                                this.data[index].costA = costs.perAcre; 
                                this.prodCostM = costs.perThousand;
                                this.prodCostA = costs.perAcre;
                                this.prodAreaCost = this.areaAcres * this.costPerAcre;    
                            }
                            this.appTotalPrice = appTotal(this.data); 
                            this.totalCostPerM = roundNum(this.appTotalPrice/(this.areaSize/1000),2);
                },1500)
            }   
           

           //for the combo box 
           get unitArea(){
            return [
                {label:'OZ/M', value:'OZ/M'}, 
                {label: 'OZ/Acre', value:'OZ/Acre'},
                {label: 'LB/M', value:'LB/M'},
                {label: 'LB/Acre', value:'LB/Acre'}
            ];
        }
//handle note 
        prodNote(e){
            let index = this.data.findIndex(prod => prod.Product2Id === e.target.name) 
            this.data[index].Note__c = e.detail.value; 
        }

        removeProd(e){
            let index = this.data.findIndex(x => x.Product__c === e);
            
            if(index > -1){
                this.data.splice(index, 1)
            }
        }
        //handle select drop down on the products
    handleOnselect(event){
        let choice = event.detail.value;
        console.log(event.target.name);
        
        switch(choice){
            case 'Note':
                 this.data.find((x)=>x.Product__c === event.target.name).showNote = true;
                 this.data.find((x)=>x.Product__c === event.target.name).btnValue = 'Stash';
                 this.data.find((x)=>x.Product__c === event.target.name).btnLabel = 'Hide Note';
                break;
            case 'Delete':
                let prodName = event.target.name; 
                this.removeProd(prodName);
                break;
            case 'Stash':
                this.data.find((e)=>e.Product__c === event.target.name).showNote = false;
                this.data.find((x)=>x.Product__c === event.target.name).btnValue = 'Note';
                this.data.find((x)=>x.Product__c === event.target.name).btnLabel = 'Add Note';
                break;
            default:
                console.log('no choice');
                
        }
    }
    newAppNote(event){
        this.oppNote = event.detail.value
    }
           //flow
           @api
           save(){
               
               this.loaded = false; 
               let note = this.oppNote.length > 0 ? this.oppNote : '';
               this.dispatchEvent(new CustomEvent('save',{
                    detail: [this.data, note]
               }));    
               //this.loaded = true; 
               return true;
           }

//Update Pricing and Fertility info displayed to per M or per Acre
           updateMeasure(){
            this.measure = this.measure === 'M' ? 'Acre' : 'M';
           }

           cancel(){
               this.dispatchEvent(new CustomEvent('cancel'))
           }

        //handle price warnings
        handleWarning = (targ, lev, flr, price, ind)=>{
            //console.log(1,lev, 2, flr, 3, price, 4, targ);
            
            if(price > lev){        
                this.template.querySelector(`[data-id="${targ}"]`).style.color ="black";
                this.template.querySelector(`[data-margin="${targ}"]`).style.color ="black";
                this.data[ind].goodPrice = true; 
               
            }else if(price<lev && price>=flr){
                this.template.querySelector(`[data-id="${targ}"]`).style.color ="orange";
                this.template.querySelector(`[data-margin="${targ}"]`).style.color ="orange";
                this.data[ind].goodPrice = true;
                
            }else if(price===lev && price>=flr){
                this.template.querySelector(`[data-id="${targ}"]`).style.color ="black";
                this.template.querySelector(`[data-margin="${targ}"]`).style.color ="black";
                this.data[ind].goodPrice = true;
                
            }else if(price<flr){
                this.template.querySelector(`[data-id="${targ}"]`).style.color ="red";
                this.template.querySelector(`[data-margin="${targ}"]`).style.color ="red";
                this.data[ind].goodPrice = false;
            }
            //seems backward but using a disable btn on the productTable. So if it's bad I need to return a true so the button is disabled. 
            this.goodPricing = checkPricing(this.data) === true ? false : true;
            
                this.dispatchEvent(new CustomEvent('price',{
                    detail: this.goodPricing
                })); 
            
        }

        hiMouse(e){
            this.showProdInfo = true; 
            let index = this.data[e.target.dataset.code];
            //console.log(index);
            this.productName = index.Product_Name__c;
            this.productCost = index.Product_Cost__c;
            this.levelOne = index.levelOne;
            this.levelTwo = index.levelTwo;
            this.prodFloor = index.floorPrice; 
            this.prodCostM = index.costM ? index.costM : perProduct(index.Total_Price__c, index.Product_Size__c, index.Rate2__c, index.Unit_Area__c).perThousand;
            this.prodCostA = index.costA ? index.costA : perProduct(index.Total_Price__c, index.Product_Size__c, index.Rate2__c, index.Unit_Area__c).perAcre;
            this.treatedAcreage = this.treatedAcreage ? this.treatedAcreage : areaTreated(index.Product_Size__c,index.Rate2__c, index.Unit_Area__c );
            this.prodN = index.N__c;
            this.prodP = index.P__c;
            this.prodK = index.K__c; 
        }
}