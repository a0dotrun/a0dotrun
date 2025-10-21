package cmd

import (
	"bytes"
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/hashicorp/go-retryablehttp"
	"github.com/spf13/cobra"
)

var (
	callbackHeaders []string
	callbackData    string
	callbackRetries int
)

var callbackCmd = &cobra.Command{
	Use:   "callback [URL]",
	Short: "Make a POST request to a URL, similar to curl.",
	Long: `Make a POST request to a URL with retries.

Similar to curl, you can specify headers with -H and data with -d.
For example:
$ callback -H "Content-Type: application/json" -d '''{"key":"value"}''' "http://example.com"
$ callback -H "Content-Type: application/json" -d @/path/to/payload.json "http://example.com"
`,
	Args: cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		url := args[0]

		var body []byte
		var err error

		if strings.HasPrefix(callbackData, "@") {
			filePath := strings.TrimPrefix(callbackData, "@")
			body, err = os.ReadFile(filePath)
			if err != nil {
				return fmt.Errorf("error reading data file: %w", err)
			}
		} else {
			body = []byte(callbackData)
		}

		req, err := retryablehttp.NewRequest("POST", url, bytes.NewReader(body))
		if err != nil {
			return fmt.Errorf("error creating request: %w", err)
		}

		for _, h := range callbackHeaders {
			parts := strings.SplitN(h, ":", 2)
			if len(parts) == 2 {
				req.Header.Set(strings.TrimSpace(parts[0]), strings.TrimSpace(parts[1]))
			}
		}

		client := retryablehttp.NewClient()
		client.RetryMax = callbackRetries
		client.Logger = nil

		resp, err := client.Do(req)
		if err != nil {
			return fmt.Errorf("error making request: %w", err)
		}
		defer resp.Body.Close()

		fmt.Printf("Status: %s\n", resp.Status)
		respBody, err := io.ReadAll(resp.Body)
		if err != nil {
			return fmt.Errorf("error reading response body: %w", err)
		}
		fmt.Printf("Response Body: %s\n", string(respBody))

		return nil
	},
}

func init() {
	callbackCmd.Flags().StringSliceVarP(&callbackHeaders, "header", "H", []string{}, "Pass custom header(s) to server (format: 'Key: Value')")
	callbackCmd.Flags().StringVarP(&callbackData, "data", "d", "", "HTTP POST data (use @filename to read from file)")
	callbackCmd.Flags().IntVarP(&callbackRetries, "retries", "r", 3, "Number of retries for failed requests")
	rootCmd.AddCommand(callbackCmd)
}
