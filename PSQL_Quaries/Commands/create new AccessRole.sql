insert into public."aAccessConstraints" (
elementid, tsmodule, htmltemplate, elementtype, elementvalue, accessrole
)
SELECT 'accessToFeesData', tsmodule, htmltemplate, elementtype, elementvalue, accessrole
	FROM public."aAccessConstraints"
	where elementid='accessToInstrumentData'