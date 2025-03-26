const extractRegulatoryInstructionsPromt = (
  text,
  csvHeaders = null,
  csvFirstRowData = null
) => {
  return `
    As a Data Analyst, I need to profile the transaction data. The following regulatory reporting instructions outline validation requirements for various transaction fields. The text below could contain varying types of instructions, descriptions, or conditions, which I need to interpret and automatically generate corresponding profiling rules in JSON format.

    ${text}

    ${
      csvHeaders &&
      csvFirstRowData &&
      `Transaction data csv to validate against those rules will have header (${csvHeaders}) and data something like (${csvFirstRowData})`
    }

    Your task is to:

    1. Extract the key validation requirements for each instruction (e.g., conditions on values, ranges, types).

    2. Interpret the instructions to create a validation rule for each field or condition described.

    3. Automatically generate a valid JSON array of rules based on the extracted data. Each rule should follow this structure:

        #field_name: The name of the field being validated (e.g., "Transaction Amount", "Account Balance").

        #rule_name: A short name for the validation rule (e.g., "Amount Match", "Non-Negative Balance").

        #description: A detailed explanation of the rule based on the instruction.

        #data_type: The expected data type for the field (e.g., "float", "string", "date").

        #validation_logic: The logic or expression used for validation (e.g., "amount == reported_amount", "amount >= 0").

        #error_message: A message that will be displayed if the validation fails (e.g., "Transaction amount must match the reported amount").

        #allowable_values: Any predefined allowable values (e.g., ranges, specific country codes, or other predefined values).

    If there are multiple conditions for a field (like thresholds or ranges), include them as separate rules in the JSON array. Ensure the output is structured as an array of JSON array objects.
  `;
};
module.exports = extractRegulatoryInstructionsPromt;
