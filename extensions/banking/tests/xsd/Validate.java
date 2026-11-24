// Validates XML files against an XSD with the JDK's own validator: libxml2 (xmllint) cannot compile the SPS schema,
// whose character-set pattern subtracts a class ("[...-[\p{C}]]"), which XSD 1.0 allows and Xerces supports.
// Usage: java Validate.java <schema.xsd> <file.xml>...
import java.io.File;
import javax.xml.XMLConstants;
import javax.xml.transform.stream.StreamSource;
import javax.xml.validation.SchemaFactory;
import javax.xml.validation.Validator;

public class Validate {
    public static void main(String[] args) throws Exception {
        SchemaFactory factory = SchemaFactory.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI);
        Validator validator = factory.newSchema(new File(args[0])).newValidator();
        int failed = 0;
        for (int i = 1; i < args.length; i++) {
            try {
                validator.validate(new StreamSource(new File(args[i])));
                System.out.println("valid   " + args[i]);
            } catch (org.xml.sax.SAXException e) {
                failed++;
                System.out.println("INVALID " + args[i] + ": " + e.getMessage());
            }
        }
        System.exit(failed == 0 ? 0 : 1);
    }
}
