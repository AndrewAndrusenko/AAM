SELECT id, elementid,elementvalue, tsmodule, htmltemplate, elementtype,  accessrole
	FROM public."aAccessConstraints"
	where accessrole='portfolioManager'