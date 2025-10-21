package cmd

import (
	"fmt"
	"strings"

	"github.com/sanchitrk/gosh"
	"github.com/spf13/cobra"
)

var (
	rootDir string
	image   string
	log     string
	httpURL string
	headers []string
	logKVs  []string
)

// builderCmd represents the builder command
var builderCmd = &cobra.Command{
	Use:   "builder",
	Short: "A brief description of your command",
	RunE: func(cmd *cobra.Command, args []string) error {
		if rootDir == "" {
			return fmt.Errorf("--dir flag is required")
		}
		if image == "" {
			return fmt.Errorf("--image flag is required")
		}

		logKVMaps := make(map[string]string)
		for _, v := range logKVs {
			parts := strings.SplitN(v, "=", 2)
			if len(parts) == 2 {
				logKVMaps[parts[0]] = parts[1]
			}
		}

		if log == "http" {
			if httpURL == "" {
				return fmt.Errorf("--log requires --http-endpoint configured")
			}

			headerMap := make(map[string]string)
			for _, h := range headers {
				parts := strings.SplitN(h, "=", 2)
				if len(parts) == 2 {
					headerMap[parts[0]] = parts[1]
				}
			}

			err := startBuildWithHTTPStream(image, rootDir, httpURL, headerMap, logKVMaps)
			if err != nil {
				return err
			}
			return nil
		}
		err := startBuild(image, rootDir, logKVMaps)
		if err != nil {
			return err
		}
		return nil
	},
}

func startBuild(image, dir string, logKVs map[string]string) error {
	gosh.ConfigureGlobals()
	gs := gosh.New()
	for k, v := range logKVs {
		gs.LogKV(k, v)
	}

	err := gs.Command("docker").
		Arg("build").
		Arg("-t").
		Arg(image).
		Arg("--cache-from").
		Arg(image).
		Arg(dir).
		Stream()

	return err
}

func startBuildWithHTTPStream(
	image, dir, httpURL string, headers map[string]string, logKVs map[string]string) error {
	gosh.ConfigureGlobals()
	gs := gosh.New()
	for k, v := range headers {
		gs.AddHTTPHeader(k, v)
	}
	for k, v := range logKVs {
		gs.LogKV(k, v)
	}

	// Fix: issue with gosh, URL must be set last.
	gs = gs.WithHTTPStream(httpURL)
	err := gs.Command("docker").
		Arg("build").
		Arg("-t").
		Arg(image).
		Arg("--cache-from").
		Arg(image).
		Arg(dir).
		Stream()

	return err
}

func init() {

	builderCmd.Flags().StringVar(&image, "image", "", "Docker image path for build")
	builderCmd.Flags().StringVar(&rootDir, "dir", "", "Path to source dir for build")
	builderCmd.Flags().StringVar(&log, "log", "console", "Logger output")
	builderCmd.Flags().StringVar(&httpURL, "http-endpoint", "", "HTTP endpoint to stream output")
	builderCmd.Flags().StringArrayVar(&headers, "header", []string{}, "Header for HTTP streaming (key=value)")
	builderCmd.Flags().StringArrayVar(&logKVs, "kv", []string{}, "Append addiontal log KV (key=value)")

	builderCmd.MarkFlagRequired("image")
	builderCmd.MarkFlagRequired("dir")
	rootCmd.AddCommand(builderCmd)
}
