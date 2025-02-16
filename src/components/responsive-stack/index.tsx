import { Fragment, type ReactElement } from "react";
import Divider from "rsuite/cjs/Divider";
import Stack from "rsuite/cjs/Stack";
import useMediaQuery from "rsuite/cjs/useMediaQuery";

function ResponsiveStack({ children }: { children: ReactElement[] }) {
  const [isDesktop] = useMediaQuery(["lg"]);
  const width = `calc(${100 / children.length}% - ${25 / children.length}px)`;

  return (
    <Stack
      direction={isDesktop ? "row" : "column"}
      spacing={isDesktop ? 0 : 8}
      alignItems="flex-start"
    >
      <Stack.Item
        grow={1}
        style={
          isDesktop ? { maxWidth: width, minWidth: width } : { width: "100%" }
        }
      >
        {children[0]}
      </Stack.Item>
      {new Array(children.length - 1).fill(null).map((value, index) => (
        <Fragment key={index}>
          {isDesktop ? <Divider vertical /> : null}
          <Stack.Item
            grow={1}
            style={
              isDesktop
                ? { maxWidth: width, minWidth: width }
                : { width: "100%" }
            }
          >
            {children[index + 1]}
          </Stack.Item>
        </Fragment>
      ))}
    </Stack>
  );
}

export default ResponsiveStack;
