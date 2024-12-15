import {
  NativeItem,
  NativeList,
  NativeListHeader,
  NativeText,
} from "@/components/Global/NativeComponents";
import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  View,
  ScrollView,
  Text,
  Platform,
  Linking,
  StyleSheet,
} from "react-native";
import { getSubjectData } from "@/services/shared/Subject";
import { Screen } from "@/router/helpers/types";

import { formatDistance } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Building,
  Clock,
  DoorOpen,
  FileText,
  Hourglass,
  Info,
  LinkIcon,
  PersonStanding,
  Users,
} from "lucide-react-native";

import * as WebBrowser from "expo-web-browser";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@react-navigation/native";
import HTMLView from "react-native-htmlview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PapillonModernHeader } from "@/components/Global/PapillonModernHeader";
import { TimetableClass } from "@/services/shared/Timetable";
import { ClassSubject } from "pawdirecte";
import { useClassSubjectStore } from "@/stores/classSubject";
import { useCurrentAccount } from "@/stores/account";
import { AccountService } from "@/stores/account/types";
import getAndOpenFile from "@/utils/files/getAndOpenFile";

const lz = (num: number) => (num < 10 ? `0${num}` : num);

const getDuration = (minutes: number): string => {
  const durationHours = Math.floor(minutes / 60);
  const durationRemainingMinutes = minutes % 60;
  return `${durationHours}h ${lz(durationRemainingMinutes)} min`;
};

const LessonDocument: Screen<"LessonDocument"> = ({ route, navigation }) => {
  const theme = useTheme();
  const stylesText = StyleSheet.create({
    body: {
      color: theme.colors.text,
      fontFamily: "medium",
      fontSize: 16,
      lineHeight: 22,
    }
  });

  const lesson = route.params.lesson as unknown as TimetableClass;
  const subjects = useClassSubjectStore();
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const account = useCurrentAccount((store) => store.account!);

  const openUrl = (url: string) => {
    if (
      account.service === AccountService.EcoleDirecte &&
			Platform.OS === "ios"
    ) {
      getAndOpenFile(account, url);
    } else {
      WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        controlsColor: theme.colors.primary,
      });
    }
  };

  useEffect(() => {
    setClassSubjects(
      subjects.subjects.filter(
        (b) =>
          new Date(b.date).getDate() ===
						new Date(lesson.startTimestamp).getDate() &&
					new Date(b.date).getMonth() ===
						new Date(lesson.startTimestamp).getMonth() &&
					lesson.subject === b.subject,
      ) ?? [],
    );
  }, []);

  const [subjectData, setSubjectData] = useState({
    color: "#888888",
    pretty: "Matière inconnue",
    emoji: "❓",
  });

  const fetchSubjectData = () => {
    const data = getSubjectData(lesson.title || "");
    setSubjectData(data);
  };

  useEffect(() => {
    fetchSubjectData();
  }, [lesson.subject]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: subjectData.pretty,
    });
  }, [navigation, subjectData]);

  const informations = [
    {
      title: "Durée et horaires",
      informations: [
        {
          icon: <Clock />,
          text: "Début du cours",
          value:
						formatDistance(new Date(lesson.startTimestamp), new Date(), {
						  addSuffix: true,
						  locale: fr,
						}) +
						" (à " +
						new Date(lesson.startTimestamp).toLocaleTimeString("fr-FR", {
						  hour: "2-digit",
						  minute: "2-digit",
						  hour12: false,
						}) +
						")",
          enabled: lesson.startTimestamp != null,
        },
        {
          icon: <Hourglass />,
          text: "Durée du cours",
          value: getDuration(
            Math.round((lesson.endTimestamp - lesson.startTimestamp) / 60000),
          ),
          enabled: lesson.endTimestamp != null,
        },
      ],
    },
    {
      title: "Cours en ligne",
      informations: [
        {
          icon: <LinkIcon />,
          text: "URL du cours",
          value: lesson.url,
          enabled: lesson.url != null,
        },
      ]
    },
    {
      title: "Contexte",
      informations: [
        {
          icon: <Building />,
          text: lesson.building?.includes(",") ? "Bâtiments" : "Bâtiment",
          value: lesson.building,
          enabled: lesson.building != null,
        },
        {
          icon: <DoorOpen />,
          text: lesson.room?.includes(",") ? "Salles de classe" : "Salle de classe",
          value: lesson.room?.split(", ").join("\n"),
          enabled: lesson.room != null,
        },
        {
          icon: <PersonStanding />,
          text: lesson.teacher?.includes(",") ? "Professeurs" : "Professeur",
          value: lesson.teacher,
          enabled: lesson.teacher != null,
        },
        {
          icon: <Users />,
          text: lesson.group?.includes(",") ? "Groupes" : "Groupe",
          value: lesson.group?.replace(/\[|\]/g, ""),
          enabled: lesson.group != null
        },
      ],
    },
    {
      title: "Statut",
      informations: [
        {
          icon: <Info />,
          text: "Statut",
          value: lesson.statusText,
          enabled: lesson.statusText != null,
        },
      ],
    },
  ];

  return (
    <>
      <PapillonModernHeader
        native
        outsideNav={true}
        startLocation={0.6}
        height={110}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              marginRight: 4,
            }}
          >
            <Text
              style={{
                fontSize: 28,
                textAlign: "center",
                width: "100%",
                marginLeft: 2,
              }}
            >
              {subjectData.emoji}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <NativeText variant="title" numberOfLines={1}>
              {subjectData.pretty}
            </NativeText>
            {lesson.itemType && (
              <NativeText variant="subtitle" numberOfLines={1}>
                {lesson.itemType}
              </NativeText>
            )}
          </View>
        </View>
      </PapillonModernHeader>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingTop: 70 + 16,
          paddingBottom: useSafeAreaInsets().bottom + 16,
        }}
        style={{ flex: 1 }}
      >
        {informations.map((info, index) => {
          if (info.informations.filter((item) => item.enabled).length === 0) {
            return null;
          }

          return (
            <View key={index}>
              <NativeListHeader label={info.title} key={index} />

              <NativeList>
                {info.informations.map((item, index) => {
                  if (!item.enabled) {
                    return null;
                  }

                  return (
                    <NativeItem
                      key={index}
                      icon={item.icon}
                      onPress={item.value && item.value.startsWith("http") ? () => Linking.openURL(item.value!) : void 0}
                    >
                      <NativeText variant="subtitle">{item.text}</NativeText>
                      <NativeText variant="default">{item.value}</NativeText>
                    </NativeItem>
                  );
                })}
              </NativeList>
            </View>
          );
        })}
        {(classSubjects.length > 0 || (lesson.ressource?.length ?? 0) > 0) && (
          <View>
            <NativeListHeader label="Contenu de séance" />
            <NativeList>
              {classSubjects.map((subject, index) => {
                return (
                  <NativeItem key={"classSubject_" + index}>
                    <HTMLView value={`<body>${subject.content}</body>`} stylesheet={stylesText} />
                    {subject.attachments.map((attachment, index) => (
                      <NativeItem
                        key={"classSubject_attachement_" + index}
                        onPress={() =>
                          openUrl(
                            `${attachment.name}\\${attachment.id}\\${attachment.kind}`,
                          )
                        }
                        icon={<FileText />}
                      >
                        <NativeText variant="title" numberOfLines={2}>
                          {attachment.name}
                        </NativeText>
                      </NativeItem>
                    ))}
                  </NativeItem>
                );
              })}
              <NativeItem>
                {lesson.ressource?.map((r, index) => {
                  let title = (r.title?.charAt(0).toUpperCase() ?? "") + (r.title?.slice(1) ?? ""); // S'assurer que la première lettre est en majuscule
                  let desc = r.description?.replace("\n\n", "\n") ?? ""; // Remplacer les doubles sauts de ligne par un seul
                  return (
                    <>
                      {index > 0 && <View style={{height: 16}}/>}
                      { !!r.category && (
                        <LinearGradient
                          colors={[subjectData.color + "80", subjectData.color]}
                          style={{
                            borderRadius: 50,
                            zIndex: 10,
                            borderWidth: 1,
                            borderColor: theme.colors.text + "20",
                            width: "auto",
                            alignSelf: "flex-start",
                            marginBottom: title ? 10 : void 0,
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                              paddingVertical: 3,
                              paddingHorizontal: 8,
                              borderRadius: 8,
                            }}
                          >
                            <NativeText style={{
                              color: "#FFF",
                              fontFamily: "semibold",
                              fontSize: 15,
                              lineHeight: 18,
                            }}
                            numberOfLines={1}
                            >
                              {r.category}
                            </NativeText>
                          </View>
                        </LinearGradient>
                      )}
                      { !!title && (
                        <NativeText variant="title" style={{flex: 1, flexWrap: "wrap"}}>
                          {title}
                        </NativeText>
                      )}
                      <HTMLView value={`<body>${desc}</body>`} stylesheet={stylesText} addLineBreaks={false} onLinkPress={url => openUrl(url) } style={{paddingLeft: 10}} key={"res_html_" + index}/>
                      {(r.files?.length ?? 0) > 0 && (
                        <>
                          <NativeText variant="overtitle" style={{marginLeft: 10, marginTop: 5}} key={"res_files_title_" + index}>
                            Pièces jointes
                          </NativeText>
                          <NativeList style={{marginLeft: 10, marginTop: 0}}>
                            {r.files?.map((file, index) => (
                              <NativeItem
                                key={"res_attach" + index}
                                onPress={() =>
                                  openUrl(file.url)
                                }
                                icon={<FileText />}
                              >
                                <NativeText variant="title" numberOfLines={2}>
                                  {file.name}
                                </NativeText>
                              </NativeItem>
                            ))}
                          </NativeList>
                        </>
                      )}
                    </>
                  );
                })}

              </NativeItem>
            </NativeList>
          </View>
        )}
      </ScrollView>
    </>
  );
};

export default LessonDocument;
