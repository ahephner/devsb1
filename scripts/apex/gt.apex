@AuraEnabled(cacheable=true)
public static List<Map<String, PricebookEntry>> mapPriorityBestPrice(List<String> pricebookIds, List<String> productIds) {
    List<Map<String, PricebookEntry>> priceListBack = new List<Map<String, PricebookEntry>>();

    if (pricebookIds.isEmpty() || productIds.isEmpty()) return priceListBack;

    // Query all relevant entries in one SOQL
    List<PricebookEntry> entries = [
        SELECT Id, Product2Id, Pricebook2Id, UnitPrice,
               Pricebook2.Name, Pricebook2.IsStandard, Pricebook2.Priority__c,
               List_Margin__c, Cost_Has_Decreased__c, Floor_Price__c, Hold_Margin__c,
               Level_1_UserView__c, Level_One_Margin__c, Level_2_UserView__c, Level_2_Margin__c,
               Floor_Margin__c, Product_Cost__c, Sub_Cat__c, List_Margin_Calculated__c,
               Product2.ERP_Name__c, Agency_Product__c
        FROM PricebookEntry
        WHERE IsActive = true
        AND Pricebook2Id IN :pricebookIds
        AND Product2Id IN :productIds
    ];

    // Map<Product2Id, Map<Pricebook2Id, PricebookEntry>>
    Map<String, Map<String, PricebookEntry>> productPricebookMap = new Map<String, Map<String, PricebookEntry>>();

    for (PricebookEntry pbe : entries) {
        String prodId = pbe.Product2Id;
        String pbId = pbe.Pricebook2Id;

        if (!productPricebookMap.containsKey(prodId)) {
            productPricebookMap.put(prodId, new Map<String, PricebookEntry>());
        }
        productPricebookMap.get(prodId).put(pbId, pbe);
    }
system.debug(productPricebookMap); 
    // Loop over products and pricebook priority to build result
    for (String prodId : productIds) {
        Map<String, PricebookEntry> pbMap = productPricebookMap.get(prodId);
        if (pbMap == null) continue;

        for (String pbId : pricebookIds) {
            if (pbMap.containsKey(pbId)) {
                Map<String, PricebookEntry> singleEntryMap = new Map<String, PricebookEntry>();
                singleEntryMap.put(prodId, pbMap.get(pbId));
                priceListBack.add(singleEntryMap);
                break; // Found best match for this product
            }
        }
    }

    return priceListBack;
}

//priceBookIds '01sO3000000KvdFIAS' '01s41000008jcbAAAQ' '01s75000000PxcGAAS' '01s75000000PxUCAA0' '01s410000077vSKAAY'
//productIds '01t2M000005M6gPQAS' '01t2M000005M6gUQAS' '01t2M000005MG8uQAG' '01t2M000005oWkTQAU'