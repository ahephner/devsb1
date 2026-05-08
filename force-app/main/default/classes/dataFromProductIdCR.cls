//Test class is appProduct in testAppProducts(); 
public with sharing class dataFromProductIdCR {
   public with sharing class prodPricing {
       @AuraEnabled
        public Product2 selectedProduct {get; set;} 
       @AuraEnabled
        public pricebookentry bestPrice {get;set;}
    }
    @AuraEnabled
    public static prodPricing prodIdToData(list<string> pIds, string id){
         prodPricing infoBack = new prodPricing(); 
        // Add List of needed info to Select, add ProductID call after where
        // Watch out for objects 
        List<Product2> products = [
            select
            Id,
            Name,
            Product_Type__c,
            Floor_Price__c,
            N__c,
            P__c,
            K__c,
            Product_Cost__c,
            X1_Gallon_Weight__c,
            Size__c,
            hasFertilizer__c,
            Agency_Pricing__c
            from Product2 where id = :id
        ];

        
        list<PricebookEntry> price = getPriceBooks.priorityBestPrice(pIds, id);

        if(!price.isEmpty()){
            infoBack.selectedProduct = products[0];
            infoBack.bestPrice = price[0]; 
        }
        return infoBack; 
    }
    //string x = dataFromProductIdCR.replaceProduct('a0Jce000000edqfEAA', '01t2M000005M6gPQAS', '01t2M000005MG8uQAG');
    //App_Product__c replacementProduct Area_Acres__c Area_Sq_Feet__c
    @AuraEnabled
    public static string replaceProduct(string program, string productBeingReplaced, App_Product__c replacementProduct ){
 
        list<string> toDelete = new list<string>();
        list<app_product__c> toInsert = new List<app_Product__c>(); 
        for(app_product__c x : [select Id, application__c, Application__r.Area__r.Area_Acres__c, Application__r.Area__r.Area_Sq_Feet__c from app_product__c where Program_Id__c =: program and Product__c =: productBeingReplaced]){
            toDelete.add(x.Id);
            
            Decimal unitsRequired = calcUnitsRequired(
            replacementProduct.Rate2__c,
            replacementProduct.Product_Size__c,
            replacementProduct.Unit_Area__c,
            x.Application__r.Area__r.Area_Acres__c,
            x.Application__r.Area__r.Area_Sq_Feet__c
        );
            
           app_product__c add = new app_product__c(); 
            add.Application__c = x.Application__c;
            add.Product__c = replacementProduct.Product__c;
            add.Rate2__c = replacementProduct.Rate2__c;
            add.Unit_Area__c = replacementProduct.Unit_Area__c;
            add.Unit_Cost__c = replacementProduct.Unit_Cost__c;
            add.Unit_Price__c = replacementProduct.Unit_Price__c;
            add.N__c = replacementProduct.N__c;
            add.P__c = replacementProduct.P__c; 
            add.K__c = replacementProduct.K__c;
            add.Cost_per_Acre__c = replacementProduct.Cost_per_Acre__c;
            add.Cost_per_M__c = replacementProduct.Cost_per_M__c; 
            //calculate:  Total_Price_LWC__c and Units_Required__c
            add.Units_Required__c = unitsRequired;
        	add.Total_Price_LWC__c = unitsRequired * replacementProduct.Unit_Price__c;
           
            toInsert.add(add);
        }
        
        Database.DeleteResult[] DR_Dels = Database.delete(toDelete, false);
        Database.SaveResult[] results = Database.insert(toInsert, false,AccessLevel.USER_MODE);
        List<String> errors = new List<String>();

		for (Database.SaveResult sr : results) {
    		if (!sr.isSuccess()) {
        		for (Database.Error err : sr.getErrors()) {
            		errors.add(err.getMessage());
        		}
    		}
		}

		if (errors.isEmpty()) {
    		return 'success';
		} else {
    		return String.join(errors, ' | ');
		}
    }
    
    private static Decimal calcUnitsRequired(
    Decimal rate,
    Decimal productSize,
    String unitArea,
    Decimal areaAcres,
    Decimal areaSqFt
) {
    if (rate == null || productSize == null || productSize == 0 || String.isBlank(unitArea)) {
        return 0;
    }

    Decimal units = 0;

    if (unitArea.contains('Acre')) {
        if (areaAcres == null) return 0;
        units = (rate * areaAcres) / productSize;
    } else if (unitArea.contains('/M')) {
        if (areaSqFt == null) return 0;
        Decimal thousands = areaSqFt / 1000;
        units = (rate * thousands) / productSize;
    } else {
        units = 0;
    }

    return units.setScale(2, RoundingMode.HALF_UP);
}
}