//this is a straight copy of attachpdfcontroller which is called by a button on the area
//this has been refactored to be called from a lwc and attach the new copy to the program not the area
public class AttachPDFContoller2 {
    @AuraEnabled
 public static string savePDF_File(string Id, string appId) {
    	
        //Retrieve Id
       // String sId = apexPages.currentPage().getParameters().get('id');
        system.debug('id '+ id);
        //Add URL to page
        PageReference pdf = Page.ClientCopy;
        pdf.getParameters().put('id',Id);
        
        //Build File
        String sPdfName = 'ClientCopy' + '.pdf';
        ContentVersion oContentVersion = new ContentVersion();
        Blob oBody;
        try {
            oBody = pdf.getContent();
        } catch (VisualforceException e) {
            oBody = Blob.valueOf('Error!');
        }
        
        oContentVersion.VersionData = oBody;
        oContentVersion.Title = sPdfName;
        oContentVersion.PathOnClient = sPdfName + '.pdf';
        insert oContentVersion;
        
        //Set Content Version of File
        Id contentDocId = [SELECT Id, Title, ContentDocumentId FROM ContentVersion WHERE Id = : oContentVersion.Id LIMIT 1].ContentDocumentId;
        
        //SetContentDocumentLink
        ContentDocumentLink contentDocLink = new ContentDocumentLink();
        contentDocLink.ContentDocumentId = contentDocId;
        contentDocLink.LinkedEntityId = appId;
        contentDocLink.ShareType = 'V';
        insert contentDocLink;
        
        //After creating the file, take user back to the record file was generated from
       PageReference clientCopyPage = new PageReference('/' + appId);
        clientCopyPage.setRedirect(true);
        //return clientCopyPage;
        return null; 
        
    } 
}