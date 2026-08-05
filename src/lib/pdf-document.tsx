import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

export type PdfItem = {
  name: string;
  quantity: string;
  category: string | null;
  checked: boolean;
};

export type PdfListData = {
  title: string;
  createdAt: Date;
  items: PdfItem[];
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: "#16a34a",
    paddingBottom: 16,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#16a34a",
  },
  subtitle: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 12,
    color: "#111827",
  },
  date: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 4,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#16a34a",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
  },
  checkbox: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderColor: "#16a34a",
    borderRadius: 2,
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: "#16a34a",
  },
  itemName: {
    flex: 1,
    fontSize: 11,
  },
  itemNameChecked: {
    textDecoration: "line-through",
    color: "#9ca3af",
  },
  quantity: {
    fontSize: 10,
    color: "#6b7280",
    width: 60,
    textAlign: "right",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 9,
    color: "#9ca3af",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
  summary: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#f0fdf4",
    borderRadius: 4,
  },
  summaryText: {
    fontSize: 10,
    color: "#166534",
  },
});

function groupByCategory(items: PdfItem[]): Map<string, PdfItem[]> {
  const groups = new Map<string, PdfItem[]>();

  for (const item of items) {
    const key = item.category?.trim() || "Autres";
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }

  return new Map(
    [...groups.entries()].sort(([a], [b]) => {
      if (a === "Autres") return 1;
      if (b === "Autres") return -1;
      return a.localeCompare(b, "fr");
    })
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

export function GroceryListPdfDocument({ data }: { data: PdfListData }) {
  const grouped = groupByCategory(data.items);
  const totalItems = data.items.length;
  const checkedCount = data.items.filter((i) => i.checked).length;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Text style={styles.logo}>🛒 ÉpicerieList</Text>
          </View>
          <Text style={styles.subtitle}>Liste d&apos;épicerie</Text>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.date}>Créée le {formatDate(data.createdAt)}</Text>
        </View>

        {[...grouped.entries()].map(([category, items]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {items.map((item, index) => (
              <View key={`${category}-${index}`} style={styles.itemRow}>
                <View
                  style={[
                    styles.checkbox,
                    item.checked ? styles.checkboxChecked : {},
                  ]}
                />
                <Text
                  style={[
                    styles.itemName,
                    item.checked ? styles.itemNameChecked : {},
                  ]}
                >
                  {item.name}
                </Text>
                <Text style={styles.quantity}>× {item.quantity}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {totalItems} article{totalItems > 1 ? "s" : ""}
            {checkedCount > 0
              ? ` · ${checkedCount} coché${checkedCount > 1 ? "s" : ""}`
              : ""}
          </Text>
        </View>

        <Text style={styles.footer}>
          Généré par ÉpicerieList · {formatDate(new Date())}
        </Text>
      </Page>
    </Document>
  );
}

export async function generateGroceryListPdf(data: PdfListData): Promise<Buffer> {
  return renderToBuffer(<GroceryListPdfDocument data={data} />);
}
