import React, { useState } from "react";
import { JSONSchemaFormDialog, JSONSchemaFormIcon } from "./tabs/Common";
import { SxProps } from "@mui/material";

interface ISchemaFormProps {
  schema: JSON;
  submit: (val: string) => void;
  iconColor?: string;
}
export const SchemaForm = ({ schema, submit, iconColor }: ISchemaFormProps) => {
  const [openSchemaFormDialog, setOpenSchemaFormDialog] = useState(false);
  const onHandleClickSchemaForm = () => {
    setOpenSchemaFormDialog(true);
  };

  return (
    <>
      <JSONSchemaFormIcon
        onClick={onHandleClickSchemaForm}
        iconColor={iconColor}
      />
      <JSONSchemaFormDialog
        schema={schema || {}}
        open={openSchemaFormDialog}
        onClose={() => setOpenSchemaFormDialog(false)}
        onSubmit={(e) => {
          submit(JSON.stringify(e.formData));
          setOpenSchemaFormDialog(false);
        }}
      />
    </>
  );
};
