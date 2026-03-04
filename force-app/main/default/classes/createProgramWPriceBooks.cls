public with sharing class createProgramWPriceBooks {
    public static string createProgramWPriceBooks(string programId, string accId, decimal areaSize, string UOM){
        //local vars
        string messBack; 
        list<app_product__c> productsToInsert = new list<app_product__c>();
        try{
        //if UOM is acre then I can calulate for required units
        decimal acreSize= UOM == 'acre' ? areaSize : (areaSize / 43560); 
        decimal thousands = UOM == 'perThousands' ? areaSize : (areaSize * 43560); 
        //need to get app products from programId
        list<app_product__c> copyProds = appProduct.allAppProducts(programId);  
        //need to get areas
        list<Area__c> copyArea =    
        //need to iterate over those products copy rate, get pricing and units required
        //need a function to get pricing or reuse from another class
        //need a function to calculate required units
        } catch(Exception e){
            messBack = e.getError(); 
        }


    }
}

